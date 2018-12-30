import { h, Component }       from 'preact'
import { RouterOnChangeArgs } from 'preact-router'

import TextField  from 'preact-material-components/TextField'
import TopAppBar  from 'preact-material-components/TopAppBar'

import 'preact-material-components/TextField/style.css'
import 'preact-material-components/TopAppBar/style.css'

import { YamlStore } from '../../shared/yaml'
import { DefaultObserver } from '../../shared'


export default class HeaderComponent extends Component<{ store: YamlStore }, { route: string, canSave: boolean }> {
  private loaded = false

  private observer = new DefaultObserver({
    loaded: () => { this.loaded = true },
    saved : () => { this.loaded = false; this.setState({ canSave: false }) },

    inserted: (node) => this.setState({ canSave: console.log(node, this.loaded) as any || this.state.canSave || (this.loaded && !node.isRoot) }),
    removed : () => this.setState({ canSave: true }),
    moved   : () => this.setState({ canSave: true }),
    propertyUpdated: () => this.setState({ canSave: true })
  })

  handleRouteChange(e: RouterOnChangeArgs) {
    this.setState({ route: e.url })
  }

  componentWillReceiveProps({ store }: { store: YamlStore }) {
    if (!store.observers.includes(this.observer))
      store.observers.push(this.observer)
  }

  save() {
    this.props.store.save()
  }

  render({ store }: { store: YamlStore }) {
    if (!store.observers.includes(this.observer))
      store.observers.push(this.observer)
    
    const disabled = (disabled: boolean, classes: string) => {
      return disabled ? 'disabled ' + classes : classes
    }

    const route = this.state.route
    const inHomeRoute = !['/edit', '/settings'].includes(route)

    return (
      <TopAppBar onNav={null}>
        <TopAppBar.Row>

          <TopAppBar.Section align-start>
            <a class={disabled(route == '/', 'material-icons mdc-top-app-bar__action-item')}
               label='Home' href='/'>home</a>
          </TopAppBar.Section>

          <TopAppBar.Section>
            <TextField outlined leadingIcon='search' placeholder='Search'
                       outerStyle={{ display: !inHomeRoute ? 'none' :  null }} />
          </TopAppBar.Section>

          <TopAppBar.Section align-end>
            <button class={disabled(!this.state.canSave, 'material-icons mdc-top-app-bar__action-item')}
                    label='Save changes' onClick={() => this.save()}>save</button>
            
            <a class={disabled(this.state.canSave || route == '/edit', 'material-icons mdc-top-app-bar__action-item')}
               label='Edit' href='/edit'>edit</a>
            
            <a class={disabled(this.state.canSave || route == '/settings', 'material-icons mdc-top-app-bar__action-item')}
               label='Settings' href='/settings'>settings</a>
          </TopAppBar.Section>

        </TopAppBar.Row>
      </TopAppBar>
    )
  }
}
