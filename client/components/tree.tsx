import { Node, NodeObserver } from '../../shared'

import CodeMirror, { Pass } from 'codemirror'
import MarkdownIt           from 'markdown-it'
import { h, Component }     from 'preact'

import 'codemirror/addon/display/autorefresh'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import { start } from 'repl';


// Markdown renderer
const md = new MarkdownIt({
  breaks: true
})


// CodeMirror editor
const createCodeMirror = (tree: Tree) => CodeMirror(document.createElement('div'), {
  mode: 'markdown',

  autofocus     : true,
  lineNumbers   : false,
  lineWrapping  : true,
  scrollbarStyle: 'null',
  viewportMargin: Infinity,

  extraKeys: {
    'Enter' (cm) {
      const node = tree.activeNode

      CodeMirror.signal(cm, 'blur')

      if (node.children.length > 0)
        tree.insertNewChild(node)
      else
        tree.insertNewSibling(node)
    },

    'Shift-Tab' (cm) {
      const node = tree.activeNode

      if (node.depth == 0)
        return

      CodeMirror.signal(cm, 'blur')

      const promise = node.decreaseDepth()

      if (promise)
        promise.then(() => tree.focus(node, null))
    },

    'Tab' (cm) {
      const node = tree.activeNode
      const promise = node.increaseDepth()

      if (!promise)
        return Pass

      CodeMirror.signal(cm, 'blur')

      promise.then(() => tree.focus(node, null))
    },

    'Up' (cm) {
      if (cm.getDoc().getCursor().line != 0)
        return Pass

      const action = tree.focusPrevious(tree.activeNode)

      if (!action)
        return

      CodeMirror.signal(cm, 'blur')
      action()
    },

    'Down' (cm) {
      const doc = cm.getDoc()

      if (doc.getCursor().line != doc.lastLine())
        return Pass
      
      const action = tree.focusNext(tree.activeNode)

      if (!action)
        return
        
      CodeMirror.signal(cm, 'blur')
      action()
    },

    'Left' (cm) {
      const doc = cm.getDoc()
      const cursor = doc.getCursor()
  
      if (cursor.line != 0 || cursor.ch != 0)
        return Pass
      
      const node = tree.activeNode
      const action = tree.focusPrevious(node, Infinity)

      if (!action)
        return Pass

      CodeMirror.signal(cm, 'blur')

      action()
    },

    'Right' (cm) {
      const doc = cm.getDoc()
      const cursor = doc.getCursor()
  
      if (cursor.line != doc.lastLine() || cursor.ch != doc.getLine(cursor.line).length)
        return Pass

      const node = tree.activeNode
      const action = tree.focusNext(node, 0)

      if (!action)
        return Pass

      CodeMirror.signal(cm, 'blur')

      action()
    },

    'Backspace' (cm) {
      if (cm.getValue().length > 0)
        return Pass
      
      const node = tree.activeNode
      const action = tree.focusPrevious(node, Infinity)

      if (!action)
        return Pass
      
      CodeMirror.signal(cm, 'blur')

      action()
      node.remove()
    }
  }
})


// Helpers
function hh<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: object | null, ...children: (string | HTMLElement)[]): HTMLElementTagNameMap[K] {
  const element = document.createElement<K>(tag)

  if (attrs) {
    for (const key in attrs)
      element.setAttribute(key, attrs[key])
  }

  for (const child of children)
    element.append(child)

  return element
}

export type HtmlNodeState = {
  wrapperElement : HTMLDivElement
  contentElement : HTMLDivElement
  childrenElement: HTMLUListElement
  displayElement : HTMLDivElement
  editElement    : HTMLDivElement
  bulletElement  : HTMLDivElement

  tokens: any[]
  markdown: string
  markdownSource: string

  hasFocus: boolean
}


let selectingMultiple = false
let lastSelected      = null

document.addEventListener('mouseup', () => {
  if (!selectingMultiple)
    return

  selectingMultiple = false
  lastSelected      = null

  document.addEventListener('mouseup', () => {
    for (const element of document.querySelectorAll('.selected'))
      element.classList.remove('selected')
  }, { once: true })
})

// Tree
export class Tree implements NodeObserver<HtmlNodeState> {
  public cm: CodeMirror.Editor
  public activeNode: Node<HtmlNodeState>

  public rootElement = document.createElement('div')

  constructor() {
    this.cm = createCodeMirror(this)

    this.cm.on('blur', async () => {
      const node = this.activeNode

      node.wrapperElement.classList.remove('focused')
      node.hasFocus = false

      await node.updateProperty('text', this.cm.getValue())

      // Update markdown render if needed
      this.updateMarkdownRender(node)
    })
  }


  private updateChildrenStyle(node: Node<HtmlNodeState>) {
    node.childrenElement.style.display = node.children.length == 0 ? 'none' : null
  }

  private updateMarkdownRender(node: Node<HtmlNodeState>) {
    if (node.text != node.markdownSource) {
      const env = {}

      node.tokens = md.parseInline(node.text, env)
      // @ts-ignore
      node.markdown = md.renderer.render(node.tokens, md.options, env)
      node.markdownSource = node.text
    }

    node.displayElement.innerHTML = node.markdown
  }

  private reinsert(node: Node<HtmlNodeState>) {
    const parent = node.parent

    if (!parent)
      return

    const index  = node.index
    const nextSibling = parent.childrenElement.childNodes[index]

    parent.childrenElement.insertBefore(node.wrapperElement, nextSibling)

    this.updateChildrenStyle(parent)
    this.updateMarkdownRender(node)
  }


  inserted(node: Node<HtmlNodeState>) {
    if (node.isRoot) {
      node.wrapperElement = hh('div', { class: 'node-wrapper' },
        node.childrenElement = hh('ul', { class: 'node-children' })
      )

      this.rootElement.innerHTML = ''
      this.rootElement.appendChild(node.wrapperElement)

      return
    }

    node.wrapperElement =
      hh('div', { class: 'node-wrapper' },
        hh('div', { class: 'node-content-line' },
          node.bulletElement = hh('div', { class: 'node-bullet' }, hh('div', { class: 'node-inner-bullet' })),
          node.contentElement = hh('div', { class: 'node-content' },
            node.displayElement = hh('div', { class: 'node-display' }),
            node.editElement    = hh('div', { class: 'node-edit' })
          )
        ),
        node.childrenElement = hh('ul', { class: 'node-children' })
      )

    node.displayElement.addEventListener('click', ev => {
      ev.stopImmediatePropagation()

      this.focus(node, ev)
    })

    // If the user starts selecting the node, then moves to other nodes, we start
    // a multi-node selection
    let selecting = false
    let previouslySelected = null

    node.displayElement.addEventListener('mouseleave', () => {
      if (!selecting)
        return

      selectingMultiple = true
      selecting = false

      node.wrapperElement.classList.add('selected')
    })

    node.displayElement.addEventListener('mouseenter', () => {
      if (!selectingMultiple)
        return

      node.wrapperElement.classList.add('selected')

      if (previouslySelected != null && previouslySelected != lastSelected)
        lastSelected.classList.remove('selected')

      previouslySelected = lastSelected
      lastSelected = node.wrapperElement
    })

    node.displayElement.addEventListener('mousedown', () => {
      selecting = true
    })

    document.addEventListener('mouseup', ev => {
      selecting = false
      previouslySelected = null
    })

    node.bulletElement.addEventListener('mouseenter', () => node.wrapperElement.classList.add('active'))
    node.bulletElement.addEventListener('mouseleave', () => node.wrapperElement.classList.remove('active'))

    this.reinsert(node)
  }

  removed(node: Node<HtmlNodeState>) {
    node.wrapperElement.remove()
  }

  propertyUpdated(node: Node<HtmlNodeState>) {
    if (!node.hasFocus && !node.isRoot)
      this.updateMarkdownRender(node)
  }

  moved(node: Node<HtmlNodeState>) {
    this.reinsert(node)
  }


  focus(node: Node<HtmlNodeState>, ev: MouseEvent | number | null) {
    function focusEditor(offset: number, endOffset: number = 0) {
      // Goal: find character that corresponds to given offset in source text
      //
      // For instance, the first line should return the second line:
      //   foo bar baz
      //            ^
      //   foo **bar** _baz_
      //                 ^
      if (node.tokens.length == 0)
        return

      const tokens = node.tokens[0].children

      let skipOffset = 0
      let remainingOffset = offset

      for (const token of tokens) {
        skipOffset += token.markup.length
        remainingOffset -= token.content.length

        if (remainingOffset < 0)
          break
      }

      const doc = cm.getDoc()
      const startOffset = skipOffset + offset

      if (endOffset > offset) {
        let skipEndOffset = 0
        let remainingEndOffset = endOffset

        for (const token of tokens) {
          skipEndOffset += token.markup.length
          remainingEndOffset -= token.content.length

          if (remainingEndOffset < 0)
            break
        }

        doc.setSelection(doc.posFromIndex(startOffset), doc.posFromIndex(skipEndOffset + endOffset))
      } else {
        doc.setCursor(doc.posFromIndex(startOffset))
      }
    }

    function getOffsetRelativeToContent(focusNode: Element, focusOffset: number): number {
      // Find all nodes before the focused node, and add their length
      // to the full offset
      let fullOffset = focusOffset
      let parent = node.displayElement

      for (const child of parent.childNodes) {
        if (child.contains(focusNode))
          break
        
        fullOffset += child.textContent.length
      }

      return fullOffset
    }

    const { anchorNode, anchorOffset, extentNode, extentOffset, isCollapsed } = window.getSelection()
    const startOffset = typeof ev == 'number' ? ev : getOffsetRelativeToContent(anchorNode as Element, anchorOffset)
    const endOffset   = typeof ev == 'number' || isCollapsed ? -1 : getOffsetRelativeToContent(extentNode as Element, extentOffset)

    const cm = this.cm

    node.hasFocus = true

    node.wrapperElement.classList.add('focused')
    node.editElement.appendChild(cm.getWrapperElement())
    
    cm.setValue(node.text)
    cm.focus()

    if (ev) {
      if (endOffset == -1)
        focusEditor(startOffset)
      else if (startOffset > endOffset)
        focusEditor(endOffset, startOffset)
      else
        focusEditor(startOffset, endOffset)
    }

    this.activeNode = node
  }

  insertNewChild(node: Node<HtmlNodeState>) {
    node
      .createChild(0)
      .then(child => console.log(child.wrapperElement) as unknown || this.focus(child, null))
  }

  insertNewSibling(node: Node<HtmlNodeState>) {
    node.parent
      .createChild(node.index + 1)
      .then(child => this.focus(child, null))
  }

  focusLast(node: Node<HtmlNodeState>, offset: number) {
    // Focus the last child of the given node
    while (node.children.length > 0)
      node = node.children[node.children.length - 1]
    
    this.focus(node, offset)
  }

  focusPrevious(node: Node<HtmlNodeState>, offset: number = this.cm.getDoc().getCursor().ch) {
    const index = node.index

    if (index > 0)
      return () => this.focusLast(node.siblings[index - 1], offset)
    else if (!node.parent.isRoot)
      return () => this.focus(node.parent, offset)
    else
      return null
  }

  focusNext(node: Node<HtmlNodeState>, offset: number = this.cm.getDoc().getCursor().ch) {
    const index = node.index
  
    if (node.children.length > 0)
      return () => this.focus(node.children[0], offset)
    else if (node.siblings.length > index + 1)
      return () => this.focus(node.siblings[index + 1], offset)
    else if (node.parent.siblings.length > node.parent.index + 1)
      return () => this.focus(node.parent.siblings[node.parent.index + 1], offset)
    else
      return null
  }
}

export default class TreeComponent extends Component<{ tree: Tree }> {
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    this.base.appendChild(this.props.tree.rootElement)
  }

  componentWillUnmount() {
    this.base.firstChild.remove()
  }

  render() {
    return <div class='tree-root' />
  }
}
