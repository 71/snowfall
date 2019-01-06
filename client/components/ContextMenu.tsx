import { h, render, Component } from 'preact'
import { route }     from 'preact-router'

import { HtmlNodeState, Tree } from './tree'
import { Node }                from '../../shared'

import Dialog     from 'preact-material-components/Dialog'
import IconButton from 'preact-material-components/IconButton'
import List       from 'preact-material-components/List'
import Menu       from 'preact-material-components/Menu'
import TextField  from 'preact-material-components/TextField'


class MetadataEditorState {
  props: { key: string; value: string }[]
  newKey: string
  newValue: string
}

class MetadataEditorProps {
  node: Node<HtmlNodeState>
}

class MetadataEditor extends Component<MetadataEditorProps, MetadataEditorState> {
  private dialog = null

  componentDidMount() {
    this.dialog.MDComponent.show()
  }

  componentWillReceiveProps({ node }: MetadataEditorProps) {
    const data = node.dataOrText

    this.setState({
      props: typeof data == 'string'
              ? [{ key: 'text', value: data }]
              : Object.keys(data).map(x => ({ key: x, value: data[x] })),
      newKey: '',
      newValue: ''
    })
  }

  render() {
    if (this.state == null || this.state.props == null)
      this.componentWillReceiveProps(this.props)

    const saveButtonDisabled = this.state.props.find(x => x.key == '' || x.value == '') != null
    const accept = () => {
      return Promise.all(
        this.state.props.map(({ key, value }) => this.props.node.updateProperty(key, value))
      )
    }

    return (
      <Dialog class='metadata-dialog' ref={x => this.dialog = x} onAccept={accept}>
        <Dialog.Body>
          { this.state.props.map(({ key, value }, i) => key != 'text' && key != 'children' &&
            <div class='metadata-item'>
              <TextField outlined label='Key' class='metadata-key' value={key}
                         onInput={e => {
                           this.state.props[i].key = (e.target as HTMLInputElement).value
                           this.setState({ props: this.state.props })
                         }} />
              <TextField outlined label='Value' class='metadata-value' value={value}
                         onInput={e => {
                           this.state.props[i].value = (e.target as HTMLInputElement).value
                           this.setState({ props: this.state.props })
                         }} />

              <IconButton onClick={() => this.state.props.splice(i, 1)}>
                <IconButton.Icon on>delete</IconButton.Icon>
                <IconButton.Icon>delete</IconButton.Icon>
              </IconButton>
            </div>
          )}

          <div class='metadata-item create'>
            <TextField outlined label='Key' class='metadata-key' value={this.state.newKey}
                       onInput={e => this.setState({ newKey: (e.target as HTMLInputElement).value })} />
            <TextField outlined label='Value' class='metadata-value' value={this.state.newValue}
                       onInput={e => this.setState({ newValue: (e.target as HTMLInputElement).value })} />

            <IconButton disabled={this.state.newKey == '' || this.state.props.find(x => x.key == this.state.newKey) != null}
                        onClick={() => {
                          this.state.props.push({ key: this.state.newKey, value: this.state.newValue})
                          this.setState({ props: this.state.props, newKey: '', newValue: '' })
                        }}>
              <IconButton.Icon on>add</IconButton.Icon>
              <IconButton.Icon>add</IconButton.Icon>
            </IconButton>
          </div>
        </Dialog.Body>

        <Dialog.Footer>
          <Dialog.FooterButton cancel>Cancel</Dialog.FooterButton>
          <Dialog.FooterButton accept default disabled={saveButtonDisabled}>Save</Dialog.FooterButton>
        </Dialog.Footer>
      </Dialog>
    )
  }
}

function openMetadataEditor(tree: Tree, node: Node<HtmlNodeState>) {
  const element = document.body.appendChild(document.createElement('div'))

  render(<MetadataEditor node={node} />, element)
}

export function openMenu(tree: Tree, node: Node<HtmlNodeState>) {
  const element = document.body.appendChild(document.createElement('div'))
  const actions: (() => void)[] = [
    () => route(node.computeStringPath()),
    () => openMetadataEditor(tree, node),

    () => tree.insertNewChild(node),
    () => tree.insertNewSibling(node),
    () => node.remove()
  ]

  if (node.children.length > 0)
    actions.splice(0, 0, () => node.wrapperElement.classList.toggle('collapsed'))

  let menu = null

  render(<Menu ref={x => menu = x}>
    { node.children.length > 0 && (node.wrapperElement.classList.contains('collapsed')
      ? <List.Item><List.ItemGraphic>expand_more</List.ItemGraphic>Expand</List.Item>
      : <List.Item><List.ItemGraphic>expand_less</List.ItemGraphic>Collapse</List.Item>
    )}
    { node.children.length > 0 &&
      <List.Divider />
    }

    <List.Item><List.ItemGraphic>fullscreen</List.ItemGraphic>Zoom in</List.Item>
    <List.Divider />
    <List.Item><List.ItemGraphic>edit</List.ItemGraphic>Edit metadata</List.Item>
    <List.Divider />

    <List.Item><List.ItemGraphic>playlist_add</List.ItemGraphic>Insert child</List.Item>
    <List.Item><List.ItemGraphic>add</List.ItemGraphic>Insert sibling</List.Item>
    <List.Item><List.ItemGraphic>delete</List.ItemGraphic>Remove</List.Item>
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
