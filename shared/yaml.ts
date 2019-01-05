import { Node, Store, BaseNode, NodeObserver, StoreObserver } from '.'
import yaml from 'yaml'


export interface FileSystem {
  read(filename: string): Promise<string>

  write(filename: string, contents: string): Promise<void>

  getFiles(): Promise<string[]>
}

export class LocalStorageFileSystem implements FileSystem {
  read(filename: string) {
    return Promise.resolve(localStorage.getItem(filename))
  }

  write(filename: string, contents: string) {
    localStorage.setItem(filename, contents)

    return Promise.resolve()
  }

  getFiles() {
    const files = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key.endsWith('.yaml'))
        files.push(key)
    }

    return Promise.resolve(files)
  }
}


class NodeHelpers {
  static getValue(node: yaml.ast.MapBase, pred: (k: string, v: yaml.ast.Pair | yaml.ast.Merge) => boolean) {
    for (const item of node.items) {
      const key = item.key!!.toJSON()

      if (pred(key, item))
        return item.value
    }

    return null
  }

  static setValue(node: yaml.ast.MapBase, key: string, value: yaml.ast.AstNode) {
    for (const item of node.items) {
      if (item.key.toJSON() == key) {
        item.value = value
        return
      }
    }

    node.items.push((<yaml.ast.MapBase>yaml.createNode({ [key]: null })).items[0])
    node.items[node.items.length - 1].value = value
  }

  static getText(node: yaml.ast.MapBase) {
    return NodeHelpers.getValue(node, k => k == 'text' || k == 'title' || k == 'note')
  }

  static getNotes(node: yaml.ast.MapBase) {
    const notes = NodeHelpers.getValue(node,
                                       k => k == 'notes' || k == 'items' || k == 'children')
    return notes as yaml.ast.Seq
  }
}

export abstract class YamlFileOrChildNode {
  public abstract kind: 'file' | 'child'
  public abstract file: YamlFileNode

  private _seq: yaml.ast.SeqBase
  private _map: yaml.ast.MapBase

  constructor(public node: yaml.ast.MapBase | yaml.ast.AstNode, public textKey: string) {
    if (node.type == 'MAP') {
      this._map = node
      this._seq = NodeHelpers.getNotes(node)
    }
  }

  get seq() {
    if (this._seq)
      return this._seq
    
    // we don't have children / we're a string
    if (this.node.type != 'MAP')
      this.node = <yaml.ast.MapBase>yaml.createNode({ text: this.node.toJSON(), children: [] })
    else
      this.node.items.push((<yaml.ast.MapBase>yaml.createNode({ children: [] })).items[0])
    
    return this._seq = NodeHelpers.getNotes(this.node)
  }

  get map() {
    if (this._map)
      return this._map
    
    return this.node = this._map = <yaml.ast.MapBase>yaml.createNode({ text: this.node.toJSON() })
  }
}

/**
 * A YAML node stored in its own file.
 */
export class YamlFileNode extends YamlFileOrChildNode {
  public kind: 'file' = 'file'
  public isDirty: boolean = true

  constructor(
    public filename: string,
    public document: yaml.ast.Document,
    public contents: string,
    public textKey : string
  ) {
    super(document.contents, textKey)
  }

  get file() {
    return this
  }
}

/**
 * A child YAML node.
 */
export class YamlChildNode extends YamlFileOrChildNode {
  public kind: 'child' = 'child'

  constructor(public node: yaml.ast.MapBase | yaml.ast.AstNode, public textKey: string = null, public file: YamlFileNode) {
    super(node, textKey)
  }
}

export type YamlStoreState = { syntax: YamlFileNode | YamlChildNode }


class IncludeNode implements yaml.ast.Node {
  comment: string
  commentBefore: string
  cstNode?: yaml.cst.Node
  range: [number, number]
  tag: string
  
  type = 'INCLUDE'
  
  constructor(public filename: string) {}

  toJSON() {
    return { __include__: this.filename }
  }
}

const includeTag: yaml.Tag = {
  class  : Object,
  default: true,
  tag    : 'tag:yaml.org,2002:include',

  // @ts-ignore
  resolve: (doc, cstNode: yaml.cst.Node) => {
    if (cstNode.type != 'PLAIN')
      throw ''
    
    return new IncludeNode(cstNode.rawValue)
  },

  stringify: (item, ctx) => {
    return `!!include ${(item as any).value.filename}`
  }
}


/**
 * A `Store` that uses the file system and YAML files as backend.
 */
export class YamlStore implements Store<YamlStoreState> {
  private saveTimeout: NodeJS.Timeout

  public files: YamlFileNode[] = []
  public root: Node<YamlStoreState>

  constructor(
    public fs       : FileSystem,
    public observers: NodeObserver<any>[],
    public throttleMs = Infinity
  ) {
    observers.push(this)
  }


  async load(filename: string) {
    this.files.length = 0
    this.root = await BaseNode.createRoot<YamlStoreState>(this.observers)

    for (const observer of this.observers) {
      const obs = observer as any as StoreObserver<any>

      if (typeof obs.loading == 'function')
        await obs.loading()
    }

    const content  = await this.fs.read(filename)
    const document = yaml.parseDocument(content, { tags: [ includeTag ] })
    const root     = new YamlFileNode(filename, document, content, null)

    this.files.push(root)

    const visit = async (parent: Node<YamlStoreState>, currentFile: YamlFileNode, items: any[], seq: yaml.ast.SeqBase) => {
      for (let i = 0; i < items.length; i++)
      {
        let item = items[i]
        let node = <yaml.ast.AstNode>seq.items[i]

        if (typeof item == 'string')
        {
          await parent.createChild(i, item, null, child => {
            child.syntax = new YamlChildNode(node, null, currentFile)
          })
        }
        else if (typeof item == 'object')
        {
          let filename = null
          let contents = null
          let document = null

          if (typeof item.__include__ == 'string')
          {
            filename = item.__include__
            contents = await this.fs.read(filename)
            document = yaml.parseDocument(contents, { tags: [ includeTag ] })

            if (!document.contents || document.contents.type != 'MAP')
              throw ''

            node = document.contents
            item = node.toJSON()
          }

          let text = null
          let textKey = null

          for (const key of ['text', 'note']) {
            if (typeof item[key] == 'string') {
              text = item[key]
              textKey = key

              break
            }
          }

          if (!text)
            throw ''

          const child = await parent.createChild(i, text, item, child => {
            if (filename) {
              child.syntax = new YamlFileNode(filename, document, contents, textKey)

              this.files.push(child.syntax)
            } else {
              child.syntax = new YamlChildNode(node, textKey, currentFile)
            }
          })

          const map = <yaml.ast.Map>node

          if (item.notes)
            await visit(child, child.syntax.file, item.notes, NodeHelpers.getValue(map, k => k == 'notes') as yaml.ast.Seq)
          else if (item.items)
            await visit(child, child.syntax.file, item.items, NodeHelpers.getValue(map, k => k == 'items') as yaml.ast.Seq)
          else if (item.children)
            await visit(child, child.syntax.file, item.children, NodeHelpers.getValue(map, k => k == 'children') as yaml.ast.Seq)
        }
        else
        {
          throw 'Invalid YAML document.'
        }
      }
    }

    if (!document.contents || document.contents.type != 'MAP')
      throw ''

    const items = NodeHelpers.getValue(document.contents, k => k == 'items' || k == 'notes')

    if (!items || items.type != 'SEQ')
      throw ''

    this.root.syntax = root

    await this.root.insert(null, 0)

    await visit(this.root, root, items.toJSON(), items)

    for (const observer of this.observers) {
      const obs = observer as any as StoreObserver<any>

      if (typeof obs.loaded == 'function')
        await obs.loaded()
    }
  }


  async save() {
    clearTimeout(this.saveTimeout)

    this.saveTimeout = null

    for (const observer of this.observers) {
      const obs = observer as any as StoreObserver<any>

      if (typeof obs.saving == 'function')
        await obs.saving()
    }

    for (const file of this.files) {
      if (!file.isDirty)
        continue
      
      const str = file.document.toString()

      await this.fs.write(file.filename, str)

      file.contents = str
      file.isDirty = false
    }

    for (const observer of this.observers) {
      const obs = observer as any as StoreObserver<any>

      if (typeof obs.saved == 'function')
        await obs.saved()
    }
  }


  private scheduleSave() {
    const throttle = this.throttleMs

    if (throttle == Infinity)
      return
    
    if (this.saveTimeout)
      clearTimeout(this.saveTimeout)
    
    this.saveTimeout = setTimeout(() => {
      this.save()
    }, throttle)
  }

  private markDirty(node: Node<YamlStoreState>) {
    node.syntax.file.isDirty = true

    this.files.forEach(file => console.log(file.document.toString()))

    this.scheduleSave()
  }


  inserted(node: Node<YamlStoreState>) {
    if (node.syntax || !node.parent)
      // already initialized (or root), we don't care
      return
    
    node.syntax = new YamlChildNode(yaml.createNode(node.data || { text: node.text }) as any, 'text', node.parent.syntax.file)
    node.parent.syntax.seq.items.splice(node.index, 0, <yaml.ast.Map>node.syntax.map)

    this.markDirty(node)
  }

  removed(node: Node<YamlStoreState>, oldParent: Node<YamlStoreState>, oldIndex: number) {
    node.syntax = null
    oldParent.syntax.seq.items.splice(oldIndex, 1)

    this.markDirty(oldParent)
  }

  propertyUpdated(node: Node<YamlStoreState>, propertyKey: string, newValue: any, oldValue: any) {
    NodeHelpers.setValue(node.syntax.map, propertyKey, yaml.createNode(newValue) as any)

    this.markDirty(node)
  }

  moved(node: Node<YamlStoreState>, oldParent: Node<YamlStoreState>, oldIndex: number) {
    if (node.syntax.kind == 'file') {
      console.log('fuck', node)
    }

    node.parent.syntax.seq.items.splice(node.index, 0, <yaml.ast.Map>node.syntax.map)
    oldParent.syntax.seq.items.splice(oldIndex, 1)

    if (node.syntax.kind == 'child')
      // Update file, in case it changed from one to another
      node.syntax.file = node.parent.syntax.file

    this.markDirty(node)
  }
}
