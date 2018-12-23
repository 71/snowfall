import Vue from 'vue'
import Vuetify, {
  VApp,
  VBreadcrumbs,
  VBtn,
  VContainer,
  VContent,
  VFadeTransition,
  VIcon,
  VList,
  VListTile,
  VListTileTitle,
  VMenu,
  VSpacer,
  VTextField,
  VToolbar,
  VToolbarTitle,
  VTreeview
} from 'vuetify/lib'

import 'vuetify/src/stylus/app.styl'


Vue.use(Vuetify, {
  components: {
    VApp,
    VBreadcrumbs,
    VBtn,
    VContainer,
    VContent,
    VFadeTransition,
    VIcon,
    VList,
    VListTile,
    VListTileTitle,
    VMenu,
    VSpacer,
    VTextField,
    VToolbar,
    VToolbarTitle,
    VTreeview
  },

  theme: {
    primary: '#ee44aa',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107'
  },

  customProperties: true,
  iconfont: 'md',
})
