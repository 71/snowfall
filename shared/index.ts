/**
 * A node in the node tree.
 */
export class BaseNode<T> {
  private _text: string
  private _parent: Node<T> | null

  public readonly children: Node<T>[] = []

  private constructor(
    public readonly observers: NodeObserver<any>[],

    text: string,
    public readonly data: object = {}
  ) {
    this._text = text
  }

  static createRoot<T>(observers: NodeObserver<any>[]) {
    return new BaseNode<T>(observers, null, {}) as any as Node<T>
  }

  get text() { return this._text }
  get parent() { return this._parent }

  get siblings() { return this._parent ? this._parent.children : [this as any as Node<T>] }

  get(key: string): any {
    return this.data[key]
  }

  get depth() {
    let depth = -1
    let node = this.parent

    while (node) {
      depth++
      node = node.parent
    }

    return depth
  }

  get id() {
    const id: number[] = []
    let node: Node<T> = this as any as Node<T>

    while (node) {
      id.splice(0, 0, node.index)
      node = node.parent
    }

    return id
  }

  get index() {
    return this.siblings.indexOf(this as any as Node<T>)
  }

  get isRoot() {
    return this.parent == null
  }

  indexOf(node: Node<T>): number {
    return this.children.indexOf(node)
  }

  computePath(parentPath: string | null = null): string {
    if (this.isRoot)
      return '/'

    const id = this.get('id')

    if (typeof id == 'string' || typeof id == 'number')
      // @ts-ignore
      return `/${this.data.id}`
    else
      return `${parentPath || this.parent.computePath()}/${this.index}`
  }

  protected notify(f: (store: NodeObserver<T>) => Promise<void> | void) {
    return Promise.all(this.observers.map(f))
  }

  /**
   * Creates a new child at the given index.
   */
  async createChild(index: number, text: string = '', data: object = {}, init: (node: Node<T>) => void = null) {
    const child = new BaseNode(this.observers, text, data) as unknown as Node<T>

    if (init)
      init(child)

    await child.insert(this as unknown as Node<T>, index)

    return child
  }

  /**
   * Inserts a new node as a child of the given parent.
   */
  insert(parent: Node<T>, index: number) {
    if (parent)
      parent.children.splice(index, 0, this as any)

    this._parent = parent

    return this.notify(store => store.inserted(this as any))
  }

  /**
   * Removes the given node from the tree.
   */
  remove() {
    const index = this.index
    const oldParent = this._parent

    this._parent.children.splice(index, 1)
    this._parent = null

    return this.notify(store => store.removed(this as any, oldParent, index))
  }

  /**
   * Moves the given node to another parent.
   */
  move(newParent: Node<T>, index: number) {
    const oldParent = this._parent
    const oldIndex = this.index

    newParent.children.splice(index, 0, this.parent.children.splice(this.index, 1)[0])

    this._parent = newParent

    return this.notify(store => store.moved(this as any, oldParent, oldIndex))
  }

  /**
   * Updates a property of the given node.
   * 
   * If `newValue` is `undefined`, the property is removed.
   */
  updateProperty(propertyKey: string, newValue: any) {
    if (this.data[propertyKey] === newValue)
      return
    
    const oldValue = this.data[propertyKey]

    if (newValue === undefined)
      delete this.data[propertyKey]
    else
      this.data[propertyKey] = newValue
    
    if (propertyKey == 'text')
      this._text = newValue
    
    return this.notify(store => store.propertyUpdated(this as any, propertyKey, newValue, oldValue))
  }

  /**
   * Increases the depth of a node.
   * 
   * If it is the first child of another node, nothing will be done.
  */
  increaseDepth() {
    const index = this.index

    if (index == 0)
      return

    const oldParent = this._parent
    const newParent = this._parent.children[index - 1]

    newParent.children.push(this as any)

    this._parent.children.splice(index, 1)
    this._parent = newParent

    return this.notify(store => store.moved(this as any, oldParent, index))
  }

  /**
   * Decreases the depth of a node.
   * 
   * If its depth is already 0, nothing will be done.
   */
  decreaseDepth() {
    if (this._parent.isRoot)
      return

    const index = this.index
    const oldParent = this._parent
    const newParent = this._parent._parent
    const siblings  = this._parent.children

    newParent.children.splice(this._parent.index + 1, 0, this as any)

    for (let i = index + 1; i < siblings.length; i++)
      siblings[i]._parent = this as any

    this.children.push(...siblings.splice(index + 1))
    this._parent = newParent

    siblings.pop()

    return this.notify(store => store.moved(this as any, oldParent, index))
  }
}

export type Node<T = void> = T & BaseNode<T>


/**
 * Defines a structure that can watch a `Node`.
 */
export interface NodeObserver<T = any> {
  /**
   * Initializes and inserts a new node as a child of the given parent.
   */
  inserted(node: Node<T>): Promise<void> | void

  /**
   * Removes the given node from the tree.
   */
  removed(node: Node<T>, oldParent: Node<T>, oldIndex: number): Promise<void> | void

  /**
   * Moves the given node to another parent.
   */
  moved(node: Node<T>, oldParent: Node<T>, oldIndex: number): Promise<void> | void

  /**
   * Updates a property of the given node.
   *
   * If `newValue` is `undefined`, the property is removed.
   */
  propertyUpdated(node: Node<T>, propertyKey: string, newValue: any, oldValue: any): Promise<void> | void
}

export interface StoreObserver<T = any> extends NodeObserver<T> {
  loading(): Promise<void> | void
  loaded(): Promise<void> | void

  saving(): Promise<void> | void
  saved(): Promise<void> | void
}

export class DefaultObserver<T = any> implements StoreObserver<T> {
  constructor(private callbacks: {
    inserted?: (node: Node<T>) => void | Promise<void>,
    removed ?: (node: Node<T>, oldParent: Node<T>, oldIndex: number) => void | Promise<void>,
    moved   ?: (node: Node<T>, oldParent: Node<T>, oldIndex: number) => void | Promise<void>,
    propertyUpdated?: (node: Node<T>, propertyKey: string, newValue: any, oldValue: any) => void | Promise<void>,

    loading?: () => Promise<void> | void,
    loaded ?: () => Promise<void> | void,

    saving ?: () => Promise<void> | void,
    saved  ?: () => Promise<void> | void,
  }) {}

  inserted(node: Node<T>): void | Promise<void> {
    if (this.callbacks.inserted)
      return this.callbacks.inserted(node)
  }
  removed(node: Node<T>, oldParent: Node<T>, oldIndex: number): void | Promise<void> {
    if (this.callbacks.removed)
      return this.callbacks.removed(node, oldParent, oldIndex)
  } 
  moved(node: Node<T>, oldParent: Node<T>, oldIndex: number): void | Promise<void> {
    if (this.callbacks.moved)
      return this.callbacks.moved(node, oldParent, oldIndex)
  }
  propertyUpdated(node: Node<T>, propertyKey: string, newValue: any, oldValue: any): void | Promise<void> {
    if (this.callbacks.propertyUpdated)
      return this.callbacks.propertyUpdated(node, propertyKey, newValue, oldValue)
  }

  loading(): Promise<void> | void {
    if (this.callbacks.loading)
      return this.callbacks.loading()
  }
  loaded(): Promise<void> | void {
    if (this.callbacks.loaded)
      return this.callbacks.loaded()
  }
  saving(): Promise<void> | void {
    if (this.callbacks.saving)
      return this.callbacks.saving()
  }
  saved(): Promise<void> | void {
    if (this.callbacks.saved)
      return this.callbacks.saved()
  }
}

/**
 * Defines the backing store of a tree.
 * 
 * Depending on the situation, the store will be very different:
 * - On the server, it is kept in memory, and syncs changes to the underlying
 *   YAML files.
 * - On the browser, it can either be online or offline:
 *   - Online, it sends changes to the server without worrying about the underlying
 *     YAML files
*/
export interface Store<T> extends NodeObserver<T> {
  /**
   * Gets the observers of nodes of this store.
   */
  readonly observers: NodeObserver<T>[]

  /**
   * Gets the root node.
   */
  readonly root: Node<T>
}


/**
 * A queue that saves all of its changes in an array, in the order in which they
 * are performed.
 *
 * This store can be used to send changes to another instance of Paperplane for
 * synchronization purposes.
 */
export class ChangeQueue implements NodeObserver<{}> {
  public readonly changes: { type: string; payload: any[] }[] = []
  public readonly observers: ((queue: ChangeQueue) => void)[] = []

  private pushChange(type: string, ...payload: any[]) {
    this.changes.push({ type, payload })
    this.observers.forEach(observer => observer(this))
  }

  inserted(node: Node<{}>): void | Promise<void> {
    this.pushChange('inserted', node.id)
  }

  removed(node: Node<{}>, oldParent: Node<{}>, oldIndex: number): void | Promise<void> {
    this.pushChange('removed', node.id, oldParent.id, oldIndex)
  }

  moved(node: Node<{}>, oldParent: Node<{}>, oldIndex: number): void | Promise<void> {
    this.pushChange('moved', node.id, oldParent.id, oldIndex)
  }

  propertyUpdated(node: Node<{}>, propertyKey: string, newValue: any, oldValue: any): void | Promise<void> {
    this.pushChange('propertyUpdated', node.id, propertyKey, newValue, oldValue)
  }

  depthIncreased(node: Node<{}>, oldParent: Node<{}>): void | Promise<void> {
    this.pushChange('depthIncreased', node.id, oldParent.id)
  }

  depthDecreased(node: Node<{}>, oldParent: Node<{}>): void | Promise<void> {
    this.pushChange('depthDecreased', node.id, oldParent.id)
  }
}
