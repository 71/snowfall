import { h, Component } from 'preact'

import Card       from 'preact-material-components/Card'
import Select     from 'preact-material-components/Select'
import Slider     from 'preact-material-components/Slider'
import Switch     from 'preact-material-components/Switch'
import TextField  from 'preact-material-components/TextField'
import Typography from 'preact-material-components/Typography'

import { settings, Settings } from '../common/settings'

import '../styles/settings.styl'

import ConnectRemoteStorage from './ConnectRemoteStorage'


export default class SettingsComponent extends Component<{}, Settings> {
  componentWillMount() {
    this.setState(settings)
  }

  componentWillUnmount() {
    Object.assign(settings, this.state)

    settings.save()
  }

  shouldComponentUpdate(nextProps, nextState: Settings) {
    if (nextState.autosaveInterval != this.state.autosaveInterval ||
        nextState.historySize      != this.state.historySize)
      // Do not re-render for an interval change
      return false

    return true
  }

  render() {
    return (
      <div class='settings-root'>
        <Card>
          <div class='card-header'>
            <Typography headline6>Autosave</Typography>

            <Switch class='right-switch'
                    checked={this.state.autosave}
                    onChange={e => this.setState({ autosave: (e.target as HTMLInputElement).checked })} />
          </div>

          <Typography subtitle1>Autosave interval (in seconds)</Typography>
          <div style='padding: 0 .2em'>
            <Slider discrete step={1} max={60}
                    disabled={!this.state.autosave}
                    value={this.state.autosaveInterval}
                    onChange={e => this.setState({ autosaveInterval: (e as any).detail.value })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Editor</Typography>
          </div>

          <div class='card-header'>
            <Typography subtitle1>Enable editor</Typography>
            <Switch class='right-switch'
                    checked={this.state.enableEditor}
                    onChange={e => this.setState({ enableEditor: (e.target as HTMLInputElement).checked })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Theme</Typography>
          </div>

          <div class='card-header'>
            <Typography subtitle1>Enable dark mode</Typography>
            <Switch class='right-switch'
                    checked={this.state.darkMode}
                    onChange={e => this.setState({ darkMode: (e.target as HTMLInputElement).checked })} />
          </div>

          <div style='display: flex; flex-wrap: wrap; justify-content: space-between; max-width: 470px'>
            <TextField outlined type='text' label='Background color'
                       value={this.state.backgroundColor}
                       onChange={e => this.setState({ backgroundColor: (e.target as HTMLInputElement).value })} />

            <div style='height: 2.5em; margin: 1em' class='mobile' />

            <TextField outlined type='text' label='Foreground color'
                       value={this.state.foregroundColor}
                       onChange={e => this.setState({ foregroundColor: (e.target as HTMLInputElement).value })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Searching</Typography>
          </div>

          <div class='card-header'>
            <Typography subtitle1>Use fuzzy-searching</Typography>
            <Switch class='right-switch'
                    checked={this.state.useFuzzySearch}
                    onChange={e => this.setState({ useFuzzySearch: (e.target as HTMLInputElement).checked })} />
          </div>

          <div class='card-header'>
            <Typography subtitle1>Cache plain text</Typography>

            <Switch class='right-switch'
                    checked={this.state.cachePlainText}
                    onChange={e => this.setState({ cachePlainText: (e.target as HTMLInputElement).checked })} />
            <br />
          </div>
          <Typography style='margin-top: -.5em; opacity: .9' subtitle2>Consumes more memory, but improves search speed</Typography>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Quick navigation</Typography>
          </div>

          <TextField outlined type='text' label='Keyboard shortcut'
                     value={this.state.quickNavigationShorcut}
                     onChange={e => this.setState({ quickNavigationShorcut: (e.target as HTMLInputElement).value })} />
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Vim mode</Typography>
          </div>

          <div class='card-header'>
            <Typography subtitle1>Enable Vim mode</Typography>
            <Switch class='right-switch'
                    checked={this.state.useVimMode}
                    onChange={e => this.setState({ useVimMode: (e.target as HTMLInputElement).checked })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>History</Typography>
          </div>

          <Typography subtitle1>History size</Typography>
          <div style='padding: 0 .2em'>
            <Slider discrete step={1} min={1} max={999}
                    value={this.state.historySize}
                    onChange={e => this.setState({ historySize: (e as any).detail.value })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Syncing</Typography>
          </div>

          <Select outlined hintText='File system'
                  selectedIndex={['localStorage', 'remoteStorage'].indexOf(this.state.storage) + 1}
                  onChange={e => this.setState({ storage: ['localStorage', 'remoteStorage'][e.target.selectedIndex - 1] } as any)}>
              <Select.Item>Local Storage</Select.Item>
              <Select.Item>Remote Storage</Select.Item>
          </Select>

          { this.state.storage == 'remoteStorage' &&
            <ConnectRemoteStorage />
          }
        </Card>

        <div style='height: 1em' />
      </div>
    )
  }
}
