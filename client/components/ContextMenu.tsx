import { h, render } from 'preact'
import { route }     from 'preact-router'

import 'preact-material-components/List/style.css'
import 'preact-material-components/Menu/style.css'
import 'preact-material-components/MenuSurface/style.css'

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

  let menu = null

  render(<Menu ref={x => menu = x}>
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
