import { Node, NodeObserver, StoreObserver } from '../../shared'
import { settings }                          from '../common/settings'
import { PropertyChangedNotifier }           from './propertyChangedNotifier'


class HistoryItem<T extends keyof NodeObserver<any> = keyof NodeObserver<T>> {
  constructor(
    public changeType: T,
    public node      : Node<{}>,
    public details   : NodeObserver<any>[T] extends (_: any, ...args: infer Args) => any ? Args : never
  ) {}
}

/**
 * Manages history and allows undo / redo operations.
 */
export class HistoryManager<T> extends PropertyChangedNotifier implements StoreObserver<T> {
  public static readonly key = 'historyManager'

  private readonly history: HistoryItem[] = []
  private readonly undos  : HistoryItem[] = []

  private ignore : boolean = true
  private undoing: boolean = false

  private insert(historyItem: HistoryItem) {
    if (this.undoing) {
      this.undos.push(historyItem)

      if (this.undos.length == 1)
        this.notifyPropertyChanged('canRedo', true)

      return
    }

    if (this.history.length == settings.historySize)
      this.history.shift()

    this.history.push(historyItem)
    this.undos.splice(0, this.undos.length)

    if (this.history.length == 1)
      this.notifyPropertyChanged('canUndo', true)
  }

  get canUndo() {
    return this.history.length > 0
  }

  get canRedo() {
    return this.undos.length > 0
  }

  loading() {
    this.ignore = true
  }

  loaded() {
    this.ignore = false
  }

  inserted(node: Node<T>) {
    if (!this.ignore)
      this.insert(new HistoryItem('inserted', node, []))
  }

  propertyUpdated(node: Node<T>, propertyKey: string, newValue: any, oldValue: any) {
    this.insert(new HistoryItem('propertyUpdated', node, [propertyKey, newValue, oldValue]))
  }

  removed(node: Node<T>, oldParent: Node<T>, oldIndex: number) {
    this.insert(new HistoryItem('removed', node, [oldParent, oldIndex]))
  }

  moved(node: Node<T>, oldParent: Node<T>, oldIndex: number) {
    this.insert(new HistoryItem('moved', node, [oldParent, oldIndex]))
  }


  private applyOppositeChange(item: HistoryItem) {
    if (item.changeType == 'inserted') {
      item.node.remove()
    } else if (item.changeType == 'propertyUpdated') {
      item.node.updateProperty(item.details[0], item.details[2])
    } else if (item.changeType == 'moved') {
      item.node.move(item.details[0], item.details[1])
    } else {
      item.node.insert(item.details[0], item.details[1])
    }
  }

  undo() {
    if (this.history.length == 0)
      return

    this.undoing = true

    this.applyOppositeChange(this.history.pop())

    this.undoing = false

    if (this.history.length == 0)
      this.notifyPropertyChanged('canUndo', false)
  }

  redo() {
    if (this.undos.length == 0)
      return

    this.applyOppositeChange(this.undos.pop())

    if (this.undos.length == 0)
      this.notifyPropertyChanged('canRedo', false)
  }
}
