export default class Settings {
  constructor(
    public autosave = false,
    public autosaveInterval = 0,

    public backgroundColor = '#fff',
    public foregroundColor = '#000',

    public useFuzzySearch = false,
    public cachePlainText = false,

    public quickNavigationShorcut = 'Shift-Space',

    public useVimMode = false,

    public historySize = 100
  ) {}

  static load() {
    const json = localStorage.getItem('settings')

    if (json == null)
      return new Settings()

    return Object.assign(new Settings(), JSON.parse(json)) as Settings
  }

  save() {
    localStorage.setItem('settings', JSON.stringify(this))
  }
}

export const settings = Settings.load()
export const appSettings = settings
