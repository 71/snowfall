import MarkdownIt  from 'markdown-it'

import { Node, NodeObserver } from '../../shared'


export default class PlainTextCacher<T> implements NodeObserver<T & { plainText: string }> {
  public readonly md = new MarkdownIt()

  private getPlainText(node: Node<{}>): string {
    const tokens = this.md.parseInline(node.text, {})
    let text = ''

    for (const blockToken of tokens)
    for (const token of blockToken.children)
      text += token.content

    return text.toLowerCase()
  }

  inserted(node: Node<{ plainText: string }>) {
    if (node.text)
      node.plainText = this.getPlainText(node)
  }

  propertyUpdated(node: Node<{ plainText: string }>, propertyKey: string) {
    if (propertyKey == 'text' || propertyKey == 'note')
      node.plainText = this.getPlainText(node)
  }

  removed() {}
  moved() {}
}
