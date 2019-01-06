import { FileSystem } from '../../shared/yaml'
import RemoteStorage  from 'remotestoragejs'


// Initialize Remote Storage
// See: https://remotestoragejs.readthedocs.io/en/latest/getting-started/initialize-and-configure.html
export const remoteStorage = new RemoteStorage()

remoteStorage.access.claim('paperplane', 'rw')
remoteStorage.caching.enable('/paperplane/')


export class RemoteStorageFileSystem implements FileSystem {
  client = remoteStorage.scope('/paperplane/')

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
