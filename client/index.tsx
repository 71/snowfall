import { LocalStorageFileSystem, YamlStore } from '../shared/yaml'

import 'material-icons/iconfont/material-icons.css'
import 'typeface-roboto-mono'
import 'typeface-sarabun'

import { h, render } from 'preact'
import { Router }    from 'preact-router'

import Editor, { createEditorObserver }  from './components/editor'
import Header                            from './components/header'
import Settings, { Settings as Options, settings } from './components/settings'
import Tree, { Tree as DomObserver }     from './components/tree'


document.addEventListener('scroll', ev => {
  // TODO: Add elevation to appbar
})

const INDEXYAML = `
notes:
- text: hello world
- text: foo
  children:
  - text: bar
  - text: baz
`;


(async function() {
  // Set up storage...
  const observers = []

  if (settings.cachePlainText)
    observers.push(new (await import('./helpers/plainTextCacher')).default())

  const store = new YamlStore(new LocalStorageFileSystem(), observers)

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
      <Tree     default tree={tree} />
      <Editor   path='/edit' store={store} filename='index.yaml' />
      <Settings path='/settings' />
    </Router>
  )

  render(<Header ref={x => header = x} store={store} />, headerElement)
  render(<Main />, appElement)


  // Load data...
  if (!localStorage.getItem('index.yaml'))
    localStorage.setItem('index.yaml', INDEXYAML)
  
  observers.push(tree, createEditorObserver('index.yaml', store))
  
  await store.load('index.yaml')
})()
