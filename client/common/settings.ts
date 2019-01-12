import { Component } from 'preact'

import { notifyOnPropertyChange, PropertyChangedNotifier } from '../helpers/propertyChangedNotifier'
import { FileSystem } from '../../shared/yaml'

const opencolor = require('open-color/open-color.json')


export class Settings extends PropertyChangedNotifier {
  public get all() { return this }

  public autosave = false
  public autosaveInterval = 0

  public autoDarkMode = false
  public darkMode = false

  public useFuzzySearch = false
  public cachePlainText = false

  public enableEditor = false

  public quickNavigationShorcut = 'Shift-Space'

  public useVimMode = false

  public hideCompleted = false

  public historySize = 100

  public activeFile = 'index.yaml'

  public storage: 'localStorage' | 'remoteStorage' = 'localStorage'

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

  /**
   * Sets the accent color of the given element, given its depth.
   */
  setElementAccent(element: ElementCSSInlineStyle, depth: number) {
    const accent: string[10] = opencolor[Object.keys(opencolor)[3 + (depth % 12)]]

    if (this.darkMode) {
      element.style.setProperty('--accent'    , accent[5])
      element.style.setProperty('--dim-accent', accent[7])
      element.style.setProperty('--bg-accent' , accent[9])
    } else {
      element.style.setProperty('--accent'    , accent[6])
      element.style.setProperty('--dim-accent', accent[2])
      element.style.setProperty('--bg-accent' , accent[0])
    }
  }
}

export const settings = notifyOnPropertyChange(Settings.load())
export const appSettings = settings
