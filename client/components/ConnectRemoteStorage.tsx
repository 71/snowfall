import { h, Component }  from 'preact'
import Widget            from 'remotestorage-widget'

import { remoteStorage } from '../common/remoteStorage'


export default class ConnectRemoteStorage extends Component<{ }> {
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    new Widget(remoteStorage).attach('rs-widget')
  }

  componentWillUnmount() {
    this.base.firstChild.remove()
  }

  render() {
    return <div id='rs-widget' />
  }
}
