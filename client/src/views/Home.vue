<template lang="pug">
.home
  list-node(v-for='item, index in root.children', :key='item.text',
            :item='item', :index='index', :depth='0', :prepath='"/"', ref='children')
</template>

<script>
import ListNode from '@/components/ListNode'

export default {
  components: {
    ListNode
  },

  data () {
    return {
      root: this.$store.state.app.activeNode
    }
  }
}
</script>

<style lang="stylus">
.home
  width: 100%
  max-width: 1200px
</style>
