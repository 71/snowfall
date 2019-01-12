
export class PropertyChangedNotifier {
  protected readonly listeners: {
    [key in keyof this]?: ((value: this[key]) => void)[]
  } = {}

  protected notifyPropertyChanged<P extends keyof this>(prop: P, value: this[P]) {
    for (const listener of this.listeners[prop] || [])
      listener(value)
    for (const listener of this.listeners['all'] || [])
      listener(this)
  }

  listen<P extends keyof this>(prop: P, handler: (value: this[P]) => void, callNow = false) {
    if (this.listeners[prop] == null)
      this.listeners[prop] = []

    this.listeners[prop].push(handler)

    if (callNow)
      handler(this[prop])
  }
}

export function notifyOnPropertyChange<T extends PropertyChangedNotifier>(value: T): T {
  return new Proxy(value, {
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
}
