import yaml from 'js-yaml'

const LOCALSTORAGE = 'localStorage'
const DEFAULTRAW   = `
items:
- text: hello world
- text: foo
  children:
  - text: bar
  - text: baz
`

export default {
  backend: {
    name: LOCALSTORAGE,
    saveAutomatically: true
  },

  state: {
    doc: <any>{
      items: [
        { text: 'hello **world**' },
        { text: 'hello\nmultiline\nworld' },
        { text: 'foo', children: [ { text: 'bar' }, { text: 'baz' } ] }
      ]
    },
    raw: DEFAULTRAW
  },

  initializeFromLocalStorage () {
    this.state.raw = localStorage.getItem('document') || ''
    this.state.doc = yaml.safeLoad(this.state.raw, { schema: yaml.CORE_SCHEMA })
  },

  initialize () {
    const backendString = localStorage.getItem('backend')

    if (backendString) {
      this.backend = JSON.parse(backendString)

      if (this.backend.name === LOCALSTORAGE) {
        this.initializeFromLocalStorage()
      } else {
        alert('Unknown backend selected.')
      }
    } else {
      this.backend.name = LOCALSTORAGE
    }
  },

  saveToLocalStorage () {
    localStorage.setItem('backend', JSON.stringify(this.backend))
    localStorage.setItem('document', yaml.dump(this.state.doc))
  },

  save () {
    if (this.backend.name === LOCALSTORAGE) {
      this.saveToLocalStorage()
    }
  },

  updateDocument (doc: any) {
    this.state.doc = doc

    if (this.backend.saveAutomatically) {
      setTimeout(() => this.save(), 0)
    }
  }
}
