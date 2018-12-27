<template lang="pug">
.item-wrapper(:style='{ "--depth": depth }', :class='{ active: isActive }')

  .item-first-line
    // Menu (shown on right)
    v-menu(offset-y)
      v-btn(slot='activator', flat, icon, small,
            @mouseover='isActive = true', @mouseleave='isActive = false')
        v-icon(size='12px', color='#444') lens

      v-list
        v-list-tile(v-if='hasChildren && expanded', @click='expanded = false')
          v-list-tile-title Collapse
        v-list-tile(v-if='hasChildren && !expanded', @click='expanded = true')
          v-list-tile-title Expand

        v-divider(v-if='hasChildren')

        v-list-tile(:to='path')
          v-list-tile-title Zoom in

        v-divider

        v-list-tile(@click='insertNewChild')
          v-list-tile-title Insert child
        v-list-tile(@click='insertBelow')
          v-list-tile-title Insert below
        v-list-tile(@click='removeNode')
          v-list-tile-title Remove

    // Editor / render
    .item-content
      .item-edit(ref='editorWrapper')
      .item-show(ref='displayWrapper', v-if='!hasFocus', v-html='markdown', @click='focus')

  // Children (recursive)
  .item-children(v-if='hasChildren && expanded')
    list-node(v-for='child, index in item.children', :key='child.text',
              :item='child', :depth='depth + 1', :index='index', :prepath='path', ref='children')

</template>

<script>
import CodeMirror from 'codemirror/lib/codemirror'
import MarkdownIt from 'markdown-it'
import Vue from 'vue'

import yaml from 'yaml'

import 'codemirror/addon/display/autorefresh'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import { NodeHelpers, Note } from '@/store';


const md = new MarkdownIt({
  breaks: true
})

let activeNode = null

const cmEditor = CodeMirror(document.createElement('div'), {
  mode: 'markdown',

  autofocus: true,

  lineNumbers : false,
  lineWrapping: true,

  scrollbarStyle: 'null',
  viewportMargin: Infinity,

  extraKeys: {
    'Enter' (cm) {
      CodeMirror.signal(cm, 'blur')
      Vue.nextTick(() => activeNode.insertBelow())
    },

    'Shift+Tab' (cm) {
      CodeMirror.signal(cm, 'blur')
      activeNode.decreaseDepth()
    },

    'Tab' (cm) {
      CodeMirror.signal(cm, 'blur')
      activeNode.increaseDepth()
    },

    'Up' (cm) {
      if (cm.getCursor().line != 0)
        return

      CodeMirror.signal(cm, 'blur')
      activeNode.focusPrevious()
    },

    'Down' (cm) {
      if (cm.getCursor().line != cm.lineCount() - 1)
        return

      CodeMirror.signal(cm, 'blur')
      activeNode.focusNext()
    }
  }
})

export default {
  name: 'list-node',

  props: {
    depth: Number,
    index: Number,
    item : Object,
    prepath: String
  },

  data () {
    return {
      tokens: [],
      markdown: '',
      markdownSource: '',

      path: this.$props.item.computePath(this.$props.prepath),
      text: this.$props.item.text,

      expanded: true,
      hasFocus: false,
      isActive: false
    }
  },

  computed: {
    hasChildren () { return this.$props.item.children.length > 0 }
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

    focus (ev = 0) {
      const offset = typeof ev == 'number' ? ev : this.getOffsetRelativeToContent()

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

      if (ev)
        this.focusEditor(offset)
      
      activeNode = this
    },

    increaseDepth () {
      this.$store.commit('increaseDepth', { note: this.$props.item })
    },

    decreaseDepth () {
      this.$store.commit('decreaseDepth', { note: this.$props.item })
    },

    insertNewChild () {
      this.$store.commit('insert', {
        parent: this.$props.item,
        index : 0,
        note  : new Note(this.$props.item, '', [])
      })

      Vue.nextTick(() => this.$refs.children[0].focus())
    },

    insertBelow () {
      const index = this.$props.item.index

      this.$store.commit('insert', {
        parent: this.$props.item.parent,
        index : index + 1,
        note  : new Note(this.$props.item.parent, '', [])
      })

      Vue.nextTick(() => this.$parent.$refs.children[index + 1].focus())
    },

    removeNode () {
      this.$store.commit('remove', { note: this.$props.item })
    },

    focusPrevious (offset) {
      const children = this.$parent.$refs.children
      const index = this.$props.item.index

      if (index > 0)
        children[index - 1].focus(offset || cmEditor.getCursor().ch)
      else if (this.$parent.item)
        this.$parent.focus(offset || cmEditor.getCursor().ch)
    },

    focusNext (offset) {
      const children = this.$parent.$refs.children
      const node  = this.$props.item
      const index = node.index

      if (children.length > index + 1)
        children[index + 1].focus(offset || cmEditor.getCursor().ch)
      else if (node.children.length > 0)
        this.$refs.children[0].focus(offset || cmEditor.getCursor().ch)
      else
        this.$parent.focusNext(offset || cmEditor.getCursor().ch)
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

.item-show::before
  content: "\200B"


.CodeMirror
  background: transparent
  height: auto

.CodeMirror-lines, .CodeMirror pre
  padding: 0
</style>
