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
    public foregroundColor = '#000'
  ) {}
}

export default class SettingsComponent extends Component<{}, Settings> {
  componentWillMount() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}')

    this.setState(Object.assign(new Settings(), settings))
  }

  componentWillUnmount() {
    localStorage.setItem('settings', JSON.stringify(this.state))
  }

  shouldComponentUpdate(nextProps, nextState: Settings) {
    if (nextState.autosaveInterval != this.state.autosaveInterval)
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
  
            <Switch label='Autosave' style='text-align: right'
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
      </div>
    )
  }
}
