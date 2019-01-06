import { settings }           from '../common/settings'
import { Node, NodeObserver } from '../../shared'


class HistoryItem {

}

export default class HistoryManager<T> implements NodeObserver<T> {
  private readonly history: HistoryItem[] = []

  inserted(node: Node<{}>) {
  }

  propertyUpdated(node: Node<{}>, propertyKey: string) {
  }

  removed() {

  }

  moved() {

  }

  undo() {

  }

  redo() {

  }
}
