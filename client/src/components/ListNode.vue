<template lang="pug">
.item-wrapper(:style='{ "--depth": depth }', :class='{ active: itemActive }')

  .item-first-line
    // Menu (shown on right)
    v-menu(offset-y)
      v-btn(slot='activator', flat, icon, small,
            @mouseover='itemActive = true', @mouseleave='itemActive = false')
        v-icon(size='12px', color='#444') lens

      v-list
        v-list-tile(v-if='item.children && expanded', @click='expanded = false')
          v-list-tile-title Collapse
        v-list-tile(v-if='item.children && !expanded', @click='expanded = true')
          v-list-tile-title Expand

        v-divider(v-if='item.children')

        v-list-tile(:to='path')
          v-list-tile-title Zoom in

        v-divider

        v-list-tile(@click='')
          v-list-tile-title Add note
        v-list-tile(@click='')
          v-list-tile-title Remove

    // Editor / render
    .item-content
      .item-edit(ref='editorWrapper')
      .item-show(ref='displayWrapper', v-if='!hasFocus', v-html='markdown', @click='focus')

  // Children (recursive)
  .item-children(v-if='item.children && expanded')
    list-node(v-for='child in item.children', :key='child.text',
              :item='child', :depth='depth + 1', :parent='this')

</template>

<script>
import Vue from 'vue'
import MarkdownIt from 'markdown-it'
import CodeMirror from 'codemirror/lib/codemirror'

import 'codemirror/addon/display/autorefresh'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'


const md = new MarkdownIt({
  breaks: true
})

const cmEditor = CodeMirror(document.createElement('div'), {
  mode: 'markdown',

  autofocus: true,

  lineNumbers : false,
  lineWrapping: true,

  scrollbarStyle: 'null',
  viewportMargin: Infinity,

  extraKeys: {
    Enter (cm) {
      CodeMirror.signal(cm, 'blur')
    }
  }
})

export default {
  name: 'list-node',

  props: {
    item: Object,
    parent: Object,
    depth: Number
  },

  data () {
    return {
      tokens: [],
      markdown: '',
      markdownSource: '',

      text: this.$props.item.text,
      path: this.$parent.path + '/' + this.$props.item.text,

      expanded: true,
      hasFocus: false,
      itemActive: false
    }
  },

  watch: {
    text: {
      immediate: true,

      handler (val) {
        this.$props.item.text = val

        if (this.hasFocus || val == this.markdownSource)
          return

        const env = {}

        this.tokens = md.parseInline(val, env)
        this.markdown = md.renderer.render(this.tokens, md.options, env)
        this.markdownSource = val
      }
    } 
  },

  methods: {
    focusEditor (offset) {
      // Goal: find character that corresponds to given offset in source text
      //
      // For instance, the first line should return the second line:
      //   foo bar baz
      //            ^
      //   foo **bar** _baz_
      //                 ^
      let skipOffset = 0
      let remainingOffset = offset

      for (const token of this.tokens[0].children) {
        skipOffset += token.markup.length
        remainingOffset -= token.content.length

        if (remainingOffset < 0)
          break
      }
  
      cmEditor.setCursor(cmEditor.posFromIndex(skipOffset + offset))
    },

    getOffsetRelativeToContent () {
      // Find all nodes before the focused node, and add their length
      // to the full offset
      const { focusNode, focusOffset } = window.getSelection()

      let fullOffset = focusOffset
      let parent = this.$refs.displayWrapper

      for (const child of parent.childNodes) {
        if (child.contains(focusNode))
          break
        
        fullOffset += child.textContent.length
      }

      return fullOffset
    },

    focus (ev) {
      const offset = this.getOffsetRelativeToContent()

      this.hasFocus = true

      this.$refs.displayWrapper.style.display = 'none'
      this.$refs.editorWrapper.style.display = null
      this.$refs.editorWrapper.appendChild(cmEditor.getWrapperElement())

      const onBlur = (() => {
        cmEditor.off('blur'  , onBlur)
        cmEditor.off('change', onChange)

        const value = cmEditor.getValue()

        cmEditor.getWrapperElement().remove()

        this.hasFocus = false
        this.$refs.editorWrapper.style.display = 'none'

        if (this.markdownSource != value)
          this.text = value
      }).bind(this)

      const onChange = (() => {
        // Why does this cause a refresh?
        //if (this.hasFocus)
        //  this.$props.item.text = cmEditor.getValue()
      }).bind(this)

      cmEditor.setValue(this.text)

      cmEditor.on('blur'  , onBlur)
      cmEditor.on('change', onChange)

      cmEditor.focus()

      this.focusEditor(offset)
    }
  }
}
</script>

<style lang="stylus">
.item-content, .CodeMirror
  font-family: Roboto, sans-serif
  font-size: 16px
  color: #111


.item-wrapper
  border-radius: .5em
  margin-top: -.3em
  padding-left: calc(var(--depth) * .4em)

  &.active
    background-color: #eee

.item-content
  display: inline-block

.item-first-line
  display: flex

.item-content
  flex-grow: 100
  margin-top: .5em

.item-children
  border-left: solid #ddd 1px
  display: block
  margin-left: 1.5em
  margin-top: 0em


.CodeMirror
  background: transparent
  height: auto

.CodeMirror-lines, .CodeMirror pre
  padding: 0
</style>
