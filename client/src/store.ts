import yaml from 'yaml'
import Vuex from 'vuex'
import { Route } from 'vue-router';

const DEFAULTRAW   = `
items:
- text: hello world
- text: foo
  children:
  - text: bar
  - text: baz
`

function notNull<T extends { range: [number, number] | null }>(value: T | null): T {
  if (value == null)
    throw new Error("Value cannot be null.")

  return value
}

export class NodeHelpers {
  static getValue(node: yaml.ast.MapBase, pred: (k: string, v: yaml.ast.Pair | yaml.ast.Merge) => boolean) {
    for (const item of node.items) {
      const key = item.key!!.toJSON()

      if (pred(key, item))
        return item.value
    }

    return null
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

export class Note {
  private textKey: string | null

  constructor(
    public parent  : Note,
    public data    : { text: string } | { title: string } | { note: string } | string,
    public children: Note[]
  ) {
    if (typeof data == 'string')
      this.textKey = null
    else if (data.hasOwnProperty('text'))
      this.textKey = 'text'
    else if (data.hasOwnProperty('title'))
      this.textKey = 'title'
    else
      this.textKey = 'note'
  }

  get text() {
    if (typeof this.data == 'string')
      return this.data

    // @ts-ignore
    return this.data[this.textKey]
  }

  set text(value) {
    if (typeof this.data == 'string')
      this.data = value
    else
      // @ts-ignore
      this.data[this.textKey] = value
  }

  get index() {
    return this.parent.children.indexOf(this)
  }

  get isRoot() {
    return this.parent == null
  }

  indexOf(note: Note): number {
    return this.children.indexOf(note)
  }

  computePath(parentPath: string | null = null): string {
    if (this.isRoot)
      return '/'

    if (this.data.hasOwnProperty('id'))
      // @ts-ignore
      return `/${this.data.id}`
    else
      return `${parentPath || this.parent.computePath()}/${this.index}`
  }

  get(key: string): any {
    // @ts-ignore
    return this.data[key]
  }
}


function yamlDocToNotes(doc: string): { root: Note; ids: { [key: string]: Note } } {
  const ids  : { [key: string]: Note } = {}

  const document = yaml.parse(doc)
  // @ts-ignore
  const root = new Note(null, '', [])

  function collect(parent: Note, items: any, depth: number) {
    for (const item of items || []) {
      if (typeof item == 'string') {
        parent.children.push(new Note(parent, item, []))
      } else if (typeof item == 'object') {
        const note = new Note(parent, item, []) 

        parent.children.push(note)

        if (typeof item.id == 'string')
          ids[item.id] = note
        else if (typeof item.id == 'number')
          ids[item.id.toString()] = note

        collect(note, item.notes || item.items || item.children, depth + 1)
      } else {
        throw new Error('Invalid YAML document.')
      }
    }
  }

  collect(root, document.notes || document.items, 0)

  return {
    root,
    ids
  }
}

export class Mutations {
  static readonly UPDATE_ROUTE: string = 'updateRoute'
}

export default ({ doc }: { doc: string | null }) => new Vuex.Store({
  state: {
    app: {
      activeNode: <Note | null>null,

      // true for path that is not in home; false for invalid path
      path: <{ text: string; to: string }[] | boolean>true
    },
    doc: doc || DEFAULTRAW,
    ...yamlDocToNotes(doc || DEFAULTRAW)
  },

  mutations: {
    updateRoute (state, route: Route) {
      if (route.name != 'home') {
        state.app.path = true
        return
      }

      const paths = [ { text: 'home', to: '/' } ]

      let fullPath = ''
      let note = state.root

      for (const sub of route.path.split('/')) {
        if (!sub)
          continue

        try {
          const i = Number.parseInt(sub, 10)

          if (i < 0 || i > note.children.length) {
            state.app.path = false
            return
          }

          note = note.children[i]
        } catch {
          if (fullPath == '') {
            // Still at root, just use lookup
            note = state.ids[sub]
          } else {
            // Not at end, gotta search recursively
            const queue = [note]

            // @ts-ignore
            note = null

            while (queue.length > 0) {
              const n = queue.shift()!!

              if (n.get('id') == sub) {
                note = n
                break
              }

              queue.push(...n.children)
            }
          }

          if (note == null) {
            state.app.path = false
            return
          }
        }

        fullPath += `/${sub}`

        paths.push({ text: note.text, to: fullPath })
      }

      state.app.path = paths
      state.app.activeNode = note
    },

    insert (state, { parent, index, note }: { parent: Note; index: number; note: Note }) {
      const notes = parent.children

      if (index > notes.length)
        throw new RangeError()

      notes.splice(index, 0, note)
    },

    remove (state, { note }: { note: Note }) {
      note.parent.children.splice(note.parent.indexOf(note), 1)
    },

    updateText (state, { note, newText }: { note: Note; newText: string }) {
      note.text = newText
    },

    increaseDepth (state, { note }: { note: Note }) {
      const index = note.index

      if (index == 0)
        throw new Error('Cannot increase depth of first child.')

      note.parent.children[index - 1].children.push(note)
      note.parent.children.splice(index, 1)
    },

    decreaseDepth (state, { note }: { note: Note }) {
      if (note.parent.isRoot)
        throw new Error('Cannot decrease depth of root node.')
      
      note.children.push(...note.parent.children.splice(note.index + 1))
      note.parent.children.splice(note.index, 1)
      note.parent.parent.children.splice(note.parent.index + 1, 0, note)
    },

    move (state, { note, index, parent }: { note: Note; index: number; parent: Note }) {
      const notes = parent.children

      if (index > notes.length)
        throw new RangeError()

      notes.splice(index, 0, note.parent.children.splice(note.index, 1)[0])
    }
  },

  actions: {
    save (context) {

    }
  }
})
