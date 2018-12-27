<template lang="pug">
v-app
  v-toolbar(app, dark, color='primary')
    template(v-if=' $route.name === "home" ')
      v-breadcrumbs(:items='$store.state.app.path')
        v-icon(slot='divider') forward

      v-spacer
      v-spacer

      v-text-field.mx-3(v-if='$route.name == "home"', hide-details, single-line, flat, solo-inverted, append-icon='search', clearable)

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
import { Mutations } from '@/store';

export default {
  name: 'App'
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
