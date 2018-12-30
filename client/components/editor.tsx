import { h, Component } from 'preact'

import CodeMirror from 'codemirror/lib/codemirror'

import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml'

import { YamlStore, YamlStoreState } from '../../shared/yaml'
import { DefaultObserver, Node } from '../../shared'


const editor = CodeMirror(document.createElement('div'), {
  mode: 'yaml',

  autofocus  : true,
  lineNumbers: false
})

export const createEditorObserver = (filename: string, store: YamlStore) => new DefaultObserver({
  saved: () => {
    const [file] = store.files.filter(x => x.filename == filename)

    if (file)
      editor.setValue(file.contents)
  
    editor.setOption('readOnly', false)
  },
  loaded: () => {
    const [file] = store.files.filter(x => x.filename == filename)

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
    if (node.syntax.kind == 'file' && node.syntax.filename == filename)
      editor.setValue(node.syntax.contents)
  }
})

export default class EditorComponent extends Component<{ filename?: string, store: YamlStore }, { changed: boolean }> {
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    this.base.appendChild(editor.getWrapperElement())
    editor.refresh()
  }

  componentWillUnmount() {
    this.base.firstChild.remove()

    if (this.state.changed) {
      this.props.store.load('index.yaml')
    }
  }

  render({ store }: { store: YamlStore }) {
    editor.on('change', () => {
      const [file] = store.files.filter(x => x.filename == this.props.filename)

      if (!file)
        return

      file.isDirty = true
      file.contents = editor.getValue()

      store.fs.write(file.filename, file.contents)

      this.setState({ changed: true })
    })

    return <div class='editor-root' />
  }
}
