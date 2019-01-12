import { h, render } from 'preact'
import AsyncRoute    from 'preact-async-route'
import { Router }    from 'preact-router'

import 'material-icons/iconfont/material-icons.css'
import 'typeface-roboto-mono'
import 'typeface-sarabun'

import 'preact-material-components/style.css'

import { settings } from './common/settings'

import { NodeObservers } from '../shared'
import { YamlStore }     from '../shared/yaml'

import { HeaderComponent as Header } from './components/Header'
import Tree, { Tree as DomObserver } from './components/Tree'


if (navigator.serviceWorker) {
  const serviceWorkerName = 'service-worker.js'

  navigator.serviceWorker
    .register(serviceWorkerName)
    .then(() => console.log('Service worker registered.'))
    .catch(err => console.warn('Service worker could not be registered.', err))
}


(async function() {
  // Set up storage...
  const observers: NodeObservers<any> = {}

  if (settings.cachePlainText) {
    const { PlainTextCacher, key } = await import('./helpers/plainTextCacher')

    observers[key] = new PlainTextCacher()
  }

  if (settings.historySize > 0) {
    const { HistoryManager } = await import('./helpers/historyManager')

    observers[HistoryManager.key] = new HistoryManager()
  }

  const fs = await settings.getFileSystem()
  const files = await fs.getFiles()

  if (!files.includes('index.yaml')) {
    await fs.createFile('index.yaml', require('fs').readFileSync(__dirname + '/common/default.yaml', 'utf8'))
  }

  const store = new YamlStore(fs, observers)

  // Set up view...
  const appElement = document.querySelector('#app')
  const headerElement = document.querySelector('#header')

  if (settings.darkMode || (settings.autoDarkMode && (new Date().getHours() > 18 || new Date().getHours() < 8)))
    document.body.classList.add('dark')

  // Clean up HTML from previous sessions...
  appElement.innerHTML = ''
  headerElement.innerHTML = ''

  const tree = new DomObserver()

  let header: Header

  const Main = () => (
    <Router onChange={ev => { header.handleRouteChange(ev); tree.handleRouteChange(ev); }}>
      <Tree default tree={tree} />

      { settings.enableEditor
      ? <AsyncRoute path='/edit'
                    getComponent={() => import('./components/Editor').then(module => module.EditorComponent)}
                    store={store} filename='index.yaml' />
      : <div path='/this-will-never-match-hopefully' />
      }
      <AsyncRoute path='/settings'
                  getComponent={() => import('./components/Settings').then(module => module.SettingsComponent)} />
    </Router>
  )

  render(<Header ref={x => header = x} store={store} fs={fs} />, headerElement)
  render(<Main />, appElement)


  // Load data...
  observers['treeComponent'] = tree

  if (settings.enableEditor) {
    const { createEditorObserver, key } = await import('./components/Editor')

    observers[key] = createEditorObserver(store)
  }

  await store.load('index.yaml')
})()
