import { FileSystem } from '../../shared/yaml'
import RemoteStorage  from 'remotestoragejs'


// Initialize Remote Storage
// See: https://remotestoragejs.readthedocs.io/en/latest/getting-started/initialize-and-configure.html
export const remoteStorage = new RemoteStorage()

remoteStorage.access.claim('snowfall', 'rw')
remoteStorage.caching.enable('/snowfall/')


export class RemoteStorageFileSystem implements FileSystem {
  client = remoteStorage.scope('/snowfall/')

  read(filename: string): Promise<string> {
    return this.client.getFile(filename).then(file => file.data)
  }

  write(filename: string, contents: string): Promise<void> {
    return this.client.storeFile('text/yaml', filename, contents)
  }

  getFiles(): Promise<string[]> {
    return this.client.getListing('').then(Object.keys)
  }

  createFile(filename: string, contents: string = 'text: hello world'): Promise<void> {
    return this.client.storeFile('text/yaml', filename, contents)
  }
}
