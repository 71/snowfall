import Vue from 'vue'

import './plugins/vuetify'
import './plugins/vuex'

import App from './App.vue'

import router from './router'
import getStore, { Mutations } from './store'

import './registerServiceWorker'

import 'material-design-icons-iconfont/dist/material-design-icons.css'


const store = getStore({
  doc: localStorage.getItem('document')
})

window.addEventListener('unload', () => {
  store.dispatch('save')
})

router.beforeResolve((to, _, next) => {
  store.commit(Mutations.UPDATE_ROUTE, to)

  if (store.state.app.path === false)
    next('/')
  else
    next()
})

Vue.config.productionTip = false

new Vue({
  router, store,

  data: {
    path: [],
    inHome: false
  },

  render: h => h(App)
}).$mount('#app')
