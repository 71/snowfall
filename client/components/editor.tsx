import { h, Component } from 'preact'

import CodeMirror from 'codemirror/lib/codemirror'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'
import 'codemirror/theme/material.css'

import { settings } from '../common/settings'
import { DefaultObserver, Node }     from '../../shared'
import { YamlStore, YamlStoreState } from '../../shared/yaml'

import '../styles/editor.styl'


const editor = CodeMirror(document.createElement('div'), {
  mode: 'yaml',
  theme: settings.darkMode ? 'material' : 'default',

  autofocus  : true,
  lineNumbers: false
})

export const createEditorObserver = (store: YamlStore) => new DefaultObserver({
  saved: () => {
    const [file] = store.files.filter(x => x.filename == settings.activeFile)

    if (file)
      editor.setValue(file.contents)

    editor.setOption('readOnly', false)
  },
  loaded: () => {
    const [file] = store.files.filter(x => x.filename == settings.activeFile)

    if (file)
      editor.setValue(file.contents)

    editor.setOption('readOnly', false)
  },

  saving: () => {
    editor.setOption('readOnly', true)
  },
  loading: () => {
    editor.setOption('readOnly', true)
  },

  inserted: (node: Node<YamlStoreState>) => {
    if (node.syntax.kind == 'file' && node.syntax.filename == settings.activeFile)
      editor.setValue(node.syntax.contents)
  }
})

export default class EditorComponent extends Component<{ store: YamlStore }, { changed: boolean }> {
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    this.base.appendChild(editor.getWrapperElement())
    editor.refresh()
  }

  componentWillUnmount() {
    this.base.firstChild.remove()

    if (this.state.changed)
      this.props.store.load('index.yaml')
  }

  render({ store }: { store: YamlStore }) {
    editor.on('change', () => {
      const [file] = store.files.filter(x => x.filename == settings.activeFile)

      if (!file) {
        store.fs.write(settings.activeFile, editor.getValue())
        return
      }

      file.isDirty = false
      file.contents = editor.getValue()

      store.fs.write(file.filename, file.contents)

      this.setState({ changed: true })
    })

    settings.listen('activeFile', activeFile => {
      const [file] = store.files.filter(x => x.filename == activeFile)

      if (!file) {
        store.fs.read(activeFile).then(editor.setValue.bind(editor))
        return
      }

      editor.setValue(file.contents)
    })

    return <div class='editor-root' />
  }
}
