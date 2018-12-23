<template lang="pug">
.home
  list-node(v-for='item in items', :key='item.text',
            :item='item', :depth='0', :parent='root')
</template>

<script>
import { Component, Vue } from 'vue-property-decorator'
import ListNode from '@/components/ListNode'

import store from '@/store'

export default {
  components: {
    ListNode
  },

  data () {
    const appData = this.$parent.$parent.$parent.$data

    let node = store.state.doc
    let fullPath = ''

    for (let i = 1; i < appData.paths.length; i++) {
      const path = appData.paths[i]

      let foundItem = false

      for (const item of node.items || node.children || []) {
        if (item.text != path.text)
          continue
        
        node = item
        foundItem = true
        fullPath += item.text

        break
      }

      if (!foundItem) {
        this.$router.replace({ path: '/' })

        return {
          root: store.state.doc,
          items: store.state.doc.items,
          path: ''
        }
      }
    }

    return {
      root: node,
      items: node.items || node.children || [],
      path: fullPath
    }
  }
}
</script>

<style lang="stylus">
.home
  width: 100%
  max-width: 1200px
</style>
