import { h, render } from 'preact'
import { route }     from 'preact-router'

import { HtmlNodeState, Tree } from './tree'
import { Node }                from '../../shared'

import List from 'preact-material-components/List'
import Menu from 'preact-material-components/Menu'


export function openMenu(tree: Tree, node: Node<HtmlNodeState>) {
  const element = document.body.appendChild(document.createElement('div'))
  const actions: (() => void)[] = [
    () => route(node.computeStringPath()),

    () => tree.insertNewChild(node),
    () => tree.insertNewSibling(node),
    () => node.remove()
  ]

  if (node.children.length > 0) {
    actions.splice(0, 0, () => node.wrapperElement.classList.toggle('collapsed'))
  }

  let menu = null

  render(<Menu ref={x => menu = x}>
    { node.children.length > 0 &&
      <List.Item>{node.wrapperElement.classList.contains('collapsed') ? 'Expand' : 'Collapse'}</List.Item>
    }
    { node.children.length > 0 &&
      <List.Divider />
    }

    <List.Item>Zoom in</List.Item>
    <List.Divider />

    <List.Item>Insert child</List.Item>
    <List.Item>Insert sibling</List.Item>
    <List.Item>Remove</List.Item>
  </Menu>, element)

  element.remove()
  menu = menu.MDComponent

  menu.setAnchorElement(node.bulletElement)
  menu.hoistMenuToBody()

  menu.listen('MDCMenu:selected', e => {
    menu.destroy()
    menu.root_.remove()

    actions[e.detail.index]()
  })

  menu.open = true
}
