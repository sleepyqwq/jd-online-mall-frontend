<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppFooter from '@/components/Layout/AppFooter.vue'

const route = useRoute()

// 简单的判断，登录和注册页不显示 Header 和 Footer
const showLayout = computed(() => {
  return !['/login', '/register', '/admin/login'].includes(route.path)
})
</script>

<template>
  <div class="app-container">
    <AppHeader v-if="showLayout" />
    <div class="main-content">
      <router-view />
    </div>
    <AppFooter v-if="showLayout" />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  width: 100%;
  margin: 0 auto;
}
</style>
