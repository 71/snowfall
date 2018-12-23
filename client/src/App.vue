<template lang="pug">
v-app
  v-toolbar(app, dark, color='primary')
    v-breadcrumbs(:items='paths')
      v-icon(slot='divider') forward

    v-spacer
    v-spacer

    v-text-field.mx-3(v-if='inMain', hide-details, single-line, flat, solo-inverted, append-icon='search', clearable)

    v-menu(bottom, left)
      v-btn(slot='activator', dark, icon)
        v-icon more_vert

      v-list
        v-list-tile(to='/settings', :disabled=' $route.name === "settings" ')
          v-list-tile-title Settings

  v-content
    v-container(fluid)
      v-layout(align-center, column)
        v-fade-transition(mode='out-in')
          router-view(:key='$route.fullPath')
</template>

<script>
import 'typeface-roboto'

export default {
  name: 'App',

  methods: {
    refreshData () {
      const inMain = this.$route.name === 'home'
      const paths = [ { text: 'home', to: '/', disabled: false } ]

      let fullPath = ''

      this.$route.path.split('/').forEach(sub => {
        if (!sub)
          return

        fullPath += '/' + sub

        paths.push({ text: sub, to: fullPath, disabled: false })
      })

      if (inMain) {
        paths[paths.length - 1].disabled = true
      }

      return {
        paths,
        inMain
      }
    }
  },

  data () {
    return this.refreshData()
  },

  watch: {
    '$route.path' () {
      const data = this.refreshData()

      console.log('mhmm')

      this.paths = data.paths
      this.inMain = data.inMain
    }
  }
}
</script>

<style lang="stylus">
ul.v-breadcrumbs > li:first-child > a
  font-family: 'Material Icons'
  font-size: 24px

ul.v-breadcrumbs > li > a
  color: white!important

ul.v-breadcrumbs > li > i
  color: rgba(255, 255, 255, .6)!important
</style>
