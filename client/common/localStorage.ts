import { FileSystem } from '../../shared/yaml'


export class LocalStorageFileSystem implements FileSystem {
  read(filename: string) {
    return Promise.resolve(localStorage.getItem(filename))
  }

  write(filename: string, contents: string) {
    localStorage.setItem(filename, contents)

    return Promise.resolve()
  }

  getFiles() {
    const files = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key.endsWith('.yaml'))
        files.push(key)
    }

    return Promise.resolve(files)
  }

  createFile(filename: string, contents: string = '') {
    if (localStorage.getItem(filename) != null)
      return Promise.reject('File already exists.')

    localStorage.setItem(filename, contents)

    return Promise.resolve()
  }
}
