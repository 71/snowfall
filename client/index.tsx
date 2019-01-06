import { h, render } from 'preact'
import AsyncRoute    from 'preact-async-route'
import { Router }    from 'preact-router'

import 'material-icons/iconfont/material-icons.css'
import 'typeface-roboto-mono'
import 'typeface-sarabun'

import { settings } from './common/settings'

import { LocalStorageFileSystem, YamlStore } from '../shared/yaml'

import { createEditorObserver }      from './components/Editor'
import Header                        from './components/Header'
import Tree, { Tree as DomObserver } from './components/Tree'


if (navigator.serviceWorker) {
  const serviceWorkerName = 'service-worker.js'

  navigator.serviceWorker
    .register(serviceWorkerName)
    .then(() => console.log('Service worker registered.'))
    .catch(err => console.warn('Service worker could not be registered.', err))
}

if (!localStorage.getItem('index.yaml')) {
  // @ts-ignore
  localStorage.setItem('index.yaml', require('fs').readFileSync(__dirname + '/common/default.yaml', 'utf8'))
}


(async function() {
  // Set up storage...
  const observers = []

  if (settings.cachePlainText)
    observers.push(new (await import('./helpers/plainTextCacher')).default())

  const fs = new LocalStorageFileSystem()
  const store = new YamlStore(fs, observers)

  // Set up view...
  const appElement = document.querySelector('#app')
  const headerElement = document.querySelector('#header')

  // Clean up HTML from previous sessions...
  appElement.innerHTML = ''
  headerElement.innerHTML = ''

  const tree = new DomObserver()

  let header: Header

  const Main = () => (
    <Router onChange={ev => header.handleRouteChange(ev)}>
      <Tree default tree={tree} />

      <AsyncRoute path='/edit'
                  getComponent={() => import('./components/Editor').then(module => module.default)}
                  store={store} filename='index.yaml' />
      <AsyncRoute path='/settings'
                  getComponent={() => import('./components/Settings').then(module => module.default)} />
    </Router>
  )

  render(<Header ref={x => header = x} store={store} fs={fs} />, headerElement)
  render(<Main />, appElement)


  // Load data...
  observers.push(tree, createEditorObserver(store))

  await store.load('index.yaml')
})()
