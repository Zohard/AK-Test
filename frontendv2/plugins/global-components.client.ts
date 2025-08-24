import { defineNuxtPlugin } from '#app'
import Icon from '~/components/global/Icon.vue'
import Button from '~/components/ui/Button.vue'
import Badge from '~/components/ui/Badge.vue'
import Modal from '~/components/ui/Modal.vue'
import Select from '~/components/ui/Select.vue'

export default defineNuxtPlugin((nuxtApp) => {
  // Register global components
  nuxtApp.vueApp.component('Icon', Icon)
  nuxtApp.vueApp.component('Button', Button)
  nuxtApp.vueApp.component('Badge', Badge)
  nuxtApp.vueApp.component('Modal', Modal)
  nuxtApp.vueApp.component('Select', Select)
})