import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/settings',
      name: 'settings',

      component: () => import('./views/Settings.vue')
    },
    {
      path: '/*',
      name: 'home',
      component: Home
    }
  ]
})
