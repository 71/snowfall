import { Component } from 'preact'

import { FileSystem } from '../../shared/yaml'


export class Settings {
  private readonly listeners: {
    [key in keyof this]?: ((value: this[key]) => void)[]
  } = {}

  public get all() { return this }

  public autosave = false
  public autosaveInterval = 0

  public backgroundColor = '#fff'
  public foregroundColor = '#000'
  public darkMode = false

  public useFuzzySearch = false
  public cachePlainText = false

  public enableEditor = false

  public quickNavigationShorcut = 'Shift-Space'

  public useVimMode = false

  public historySize = 100

  public activeFile = 'index.yaml'

  public storage: 'localStorage' | 'remoteStorage' = 'localStorage'

  notifyPropertyChanged<P extends keyof this>(prop: P, value: this[P]) {
    for (const listener of this.listeners[prop] || [])
      listener(value)
    for (const listener of this.listeners['all'] || [])
      listener(this)
  }

  listen<P extends keyof this>(prop: P, handler: (value: this[P]) => void) {
    if (this.listeners[prop] == null)
      this.listeners[prop] = []

    this.listeners[prop].push(handler)
  }

  dependOn(component: Component, ...props: (keyof this)[]) {
    for (const prop of props)
      this.listen(prop, () => component.forceUpdate())
  }

  static load() {
    const json = localStorage.getItem('settings')

    if (json == null)
      return new Settings()

    return Object.assign(new Settings(), JSON.parse(json)) as Settings
  }

  save() {
    const listeners = this.listeners

    // @ts-ignore
    delete this.listeners

    localStorage.setItem('settings', JSON.stringify(this))

    // @ts-ignore
    this.listeners = listeners
  }

  /**
   * Returns whether the given page is a 'main page', that is, a page
   * that enables the user to edit their list.
   */
  isMainPage(page: string): boolean {
    return !(page == '/settings' || (this.enableEditor && page == '/edit'))
  }

  /**
   * Returns the `FileSystem` chosen by the user to store data.
   */
  async getFileSystem(): Promise<FileSystem> {
    if (this.storage == 'localStorage')
      return new (await import('./localStorage')).LocalStorageFileSystem()
    else if (this.storage == 'remoteStorage')
      return new (await import('./remoteStorage')).RemoteStorageFileSystem()
  }
}

const notifySettings = (settings: Settings) => new Proxy(settings, {
  set: (settings, key, value) => {
    if (key == 'listeners') {
      // @ts-ignore
      settings['listeners'] = value
      return true
    }

    if (typeof key != 'string' || key == 'all' || settings[key] === undefined)
      return false

    if (settings[key] != value)
      settings[key] = value

    // @ts-ignore
    settings.notifyPropertyChanged(key, value)

    return true
  }
})

export const settings = notifySettings(Settings.load())
export const appSettings = settings
