<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppFooter from '@/components/Layout/AppFooter.vue'

const route = useRoute()

// 控制是否显示前台通用的 Header 和 Footer
const showLayout = computed(() => {
  const path = route.path

  // 1. 前台登录/注册页不显示
  if (['/login', '/register'].includes(path)) {
    return false
  }

  // 2. 所有后台管理页面（以 /admin 开头）都不显示
  // 包括 /admin/login, /admin/dashboard 等
  if (path.startsWith('/admin')) {
    return false
  }

  // 3. 其他前台页面显示
  return true
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