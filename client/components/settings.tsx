import { h, Component } from 'preact'

import Card       from 'preact-material-components/Card'
import Slider     from 'preact-material-components/Slider'
import Switch     from 'preact-material-components/Switch'
import TextField  from 'preact-material-components/TextField'
import Typography from 'preact-material-components/Typography'

import 'preact-material-components/Card/style.css'
import 'preact-material-components/Slider/style.css'
import 'preact-material-components/Switch/style.css'
import 'preact-material-components/TextField/style.css'
import 'preact-material-components/Typography/style.css'


export class Settings {
  constructor(
    public autosave = false,
    public autosaveInterval = 0,

    public backgroundColor = '#fff',
    public foregroundColor = '#000',

    public useFuzzySearch = false,
    public cachePlainText = false,

    public quickNavigationShorcut = 'Shift-Space',

    public useVimMode = false,

    public historySize = 100
  ) {}

  static load() {
    const json = localStorage.getItem('settings')

    if (json == null)
      return new Settings()

    return Object.assign(new Settings(), JSON.parse(json)) as Settings
  }

  save() {
    localStorage.setItem('settings', JSON.stringify(this))
  }
}

export const settings = Settings.load()
export const appSettings = settings

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
            <Typography headline6>Theme</Typography>
          </div>

          <div style='display: flex; flex-wrap: wrap; justify-content: space-between; max-width: 470px'>
            <TextField outlined type='text' label='Background color'
                       value={this.state.backgroundColor}
                       onChange={e => this.setState({ backgroundColor: (e.target as HTMLInputElement).value })} />
            <TextField outlined type='text' label='Foreground color'
                       value={this.state.foregroundColor}
                       onChange={e => this.setState({ foregroundColor: (e.target as HTMLInputElement).value })} />
          </div>
        </Card>

        <Card>
          <div class='card-header'>
            <Typography headline6>Searching</Typography>
          </div>

          <div class='card-header' style='width: 500px'>
            <Typography subtitle1>Use fuzzy-searching</Typography>
            <Switch class='right-switch'
                    checked={this.state.useFuzzySearch}
                    onChange={e => this.setState({ useFuzzySearch: (e.target as HTMLInputElement).checked })} />
          </div>

          <div class='card-header' style='width: 500px'>
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

          <div class='card-header' style='width: 300px'>
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

        <div style='height: 1em' />
      </div>
    )
  }
}
