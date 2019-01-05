import { h, Component }       from 'preact'
import { RouterOnChangeArgs } from 'preact-router'

import Dialog    from 'preact-material-components/Dialog'
import Menu      from 'preact-material-components/Menu'
import TabBar    from 'preact-material-components/TabBar'
import TextField from 'preact-material-components/TextField'
import TopAppBar from 'preact-material-components/TopAppBar'

import 'preact-material-components/Button/style.css'
import 'preact-material-components/Dialog/style.css'
import 'preact-material-components/List/style.css'
import 'preact-material-components/Menu/style.css'
import 'preact-material-components/MenuSurface/style.css'
import 'preact-material-components/Tab/style.css'
import 'preact-material-components/TabBar/style.css'
import 'preact-material-components/TabIndicator/style.css'
import 'preact-material-components/TabScroller/style.css'
import 'preact-material-components/TextField/style.css'
import 'preact-material-components/TopAppBar/style.css'

import { settings }                  from '../common/settings'
import { DefaultObserver, Node }     from '../../shared'
import { YamlStore, YamlStoreState } from '../../shared/yaml'
import { HtmlNodeState }             from './tree'

import '../styles/header.styl'


export class HeaderComponentState {
  route  : string
  canSave: boolean

  canUndo: boolean
  canRedo: boolean
}

const stringIncludes = settings.useFuzzySearch
                     ? require('fuzzysearch')
                     : (needle: string, haystack: string) => haystack.includes(needle)

export default class HeaderComponent extends Component<{ store: YamlStore }, HeaderComponentState> {
  private loaded = false

  private observer = new DefaultObserver({
    loaded: () => { this.loaded = true },
    saved : () => { this.loaded = false; this.setState({ canSave: false }) },

    inserted: (node) => this.setState({ canSave: this.state.canSave || (this.loaded && !node.isRoot) }),
    removed : () => this.setState({ canSave: true }),
    moved   : () => this.setState({ canSave: true }),
    propertyUpdated: () => this.setState({ canSave: true })
  })

  handleRouteChange(e: RouterOnChangeArgs) {
    this.setState({ route: e.url })
  }

  handleSearchChange(e: UIEvent) {
    const query = (e.target as HTMLInputElement).value.toLowerCase()

    if (query.length == 0) {
      for (const element of document.querySelectorAll('.partial-match'))
        element.classList.remove('no-match', 'partial-match')

      return
    }

    const visit = (node: Node<HtmlNodeState & YamlStoreState>) => {
      // @ts-ignore
      const match = (typeof node.plainText == 'string' && stringIncludes(query, node.plainText))
                 || (node.displayElement && stringIncludes(query, node.displayElement.textContent.toLowerCase()))

      let partialMatch = match

      for (const child of node.children)
        // 'partialMatch' comes after since we want to visit the children either way
        //                                                            (unlike you, dad)
        partialMatch = visit(child) || partialMatch

      if (match) {
        node.wrapperElement.classList.remove('no-match', 'partial-match')
      } else if (partialMatch) {
        node.wrapperElement.classList.remove('no-match')
        node.wrapperElement.classList.add('partial-match')
      } else {
        node.wrapperElement.classList.add('no-match', 'partial-match')
      }

      return partialMatch
    }

    visit(this.props.store.root as any)
  }

  componentWillReceiveProps({ store }: { store: YamlStore }) {
    if (!store.observers.includes(this.observer))
      store.observers.push(this.observer)
  }

  save() {
    this.props.store.save()
  }

  undo() {

  }

  redo() {

  }

  render({ store }: { store: YamlStore }) {
    if (!store.observers.includes(this.observer))
      store.observers.push(this.observer)
    
    const disabled = (disabled: boolean, classes: string) => {
      return disabled ? 'disabled ' + classes : classes
    }

    const route = this.state.route
    const inHomeRoute = !['/edit', '/settings'].includes(route)

    let menu: Menu
    let createFileDialog: Dialog
    let fileInput: any
    let restoreTab: () => void

    return (
      <TopAppBar onNav={null}>
        <TopAppBar.Row>

          <TopAppBar.Section align-start>
            <a class={disabled(route == '/', 'material-icons mdc-top-app-bar__action-item')}
               label='Home' href='/'>home</a>
          </TopAppBar.Section>

          <TopAppBar.Section class='search-input'>
            <TextField outlined leadingIcon='search' placeholder='Search'
                       outerStyle={{ display: !inHomeRoute ? 'none' :  null }}
                       onInput={e => this.handleSearchChange(e as any)} />
          </TopAppBar.Section>

          <TopAppBar.Section align-end>
            <button class={disabled(!inHomeRoute, 'material-icons mdc-top-app-bar__action-item search-button')}
                    label='Search' onClick={() => this.save()}>search</button>

            <div style='width: 1em'></div>

            <button class={disabled(!this.state.canUndo, 'material-icons mdc-top-app-bar__action-item desktop')}
                    label='Undo' onClick={() => this.undo()}>undo</button>
            <button class={disabled(!this.state.canRedo, 'material-icons mdc-top-app-bar__action-item desktop')}
                    label='Redo' onClick={() => this.redo()}>redo</button>

            <div style='width: 1em' class='desktop'></div>

            <button class={disabled(!this.state.canSave, 'material-icons mdc-top-app-bar__action-item')}
                    label='Save changes' onClick={() => this.save()}>save</button>
            
            <a class={disabled(this.state.canSave || route == '/edit', 'material-icons mdc-top-app-bar__action-item desktop')}
               label='Edit' href='/edit'>edit</a>
            
            <a class={disabled(this.state.canSave || route == '/settings', 'material-icons mdc-top-app-bar__action-item desktop')}
               label='Settings' href='/settings'>settings</a>
            
            <button class={disabled(this.state.canSave, 'material-icons mdc-top-app-bar__action-item mobile')}
                    label='More' onClick={() => menu.MDComponent.open = true}>more_vert</button>

            <Menu.Anchor>
              <Menu ref={x => menu = x}>
                <Menu.Item disabled={!inHomeRoute || !this.state.canUndo}
                           onClick={() => this.undo()}>Undo</Menu.Item>
                <Menu.Item disabled={!inHomeRoute || !this.state.canRedo}
                           onClick={() => this.redo()}>Redo</Menu.Item>

                <li class="mdc-list-divider" role="separator"></li>

                <Menu.Item disabled={this.state.canSave || route == '/edit'}>
                  <a href='/edit'>Editor</a>
                </Menu.Item>
                <Menu.Item disabled={this.state.canSave || route == '/settings'}>
                  <a href='/settings'>Settings</a>
                </Menu.Item>
              </Menu>
            </Menu.Anchor>
          </TopAppBar.Section>

        </TopAppBar.Row>

        { route == '/edit' &&
          <TabBar ref={x => x && x.MDComponent &&
            x.MDComponent.tabList_[x.MDComponent.tabList_.length - 1].listen('MDCTab:interacted', () => {
              const activeTabIndex = x.MDComponent.tabList_.findIndex(x => x.active)
              restoreTab = () => x.MDComponent.activateTab(activeTabIndex)
              createFileDialog.MDComponent.show()

              setTimeout(() => fileInput.input_.focus(), 200)
            })
          }>
            {['index.yaml'].map(filename =>
              <TabBar.Tab active>
                <TabBar.TabLabel>{filename}</TabBar.TabLabel>
              </TabBar.Tab>
            )}

            <TabBar.Tab class='new-tab'>
              <TabBar.TabIcon>add</TabBar.TabIcon>
            </TabBar.Tab>
          </TabBar>
        }

        <Dialog class='create-dialog' ref={x => createFileDialog = x}
                onAccept={() => (fileInput.value = '') || alert('Should create a file now')}
                onCancel={() => (fileInput.value = '') || restoreTab()}>
          <Dialog.Body>
            <TextField outerStyle='width: 100%; margin-bottom: -1em'
                       outlined label='Filename' pattern='[\w\d]+\.yaml'
                       helpertextvalidationmsg='This must be a valid .yaml file name.'
                       ref={x => fileInput = x.MDComponent} />
          </Dialog.Body>

          <Dialog.Footer>
            <Dialog.FooterButton cancel>Cancel</Dialog.FooterButton>
            <Dialog.FooterButton accept default>Create</Dialog.FooterButton>
          </Dialog.Footer>
        </Dialog>
      </TopAppBar>
    )
  }
}
