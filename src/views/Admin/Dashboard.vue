<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 引入 AdminStore (保持你的逻辑不变)
import { useAdminStore } from '@/stores/adminStore'
import { adminLogout, getAdminInfo } from '@/api/admin'
import ProductPanel from './components/ProductPanel.vue'
import CategoryPanel from './components/CategoryPanel.vue'
import OrderPanel from './components/OrderPanel.vue'
import BannerPanel from './components/BannerPanel.vue'
// 引入 UI 装饰所需的额外图标
import { ArrowDown, SwitchButton, UserFilled, DataBoard } from '@element-plus/icons-vue'

const router = useRouter()
const adminStore = useAdminStore()
const activeMenu = ref('products')

// 菜单配置保持不变，使用字符串图标
const menus = [
  { key: 'products', label: '商品管理', icon: 'Goods' },
  { key: 'orders', label: '订单管理', icon: 'List' },
  { key: 'categories', label: '分类管理', icon: 'Menu' },
  { key: 'banners', label: '轮播图', icon: 'Picture' }, // 新增
]

const userName = computed(() => adminStore.userInfo.nickname || adminStore.userInfo.username || '管理员')

const fetchAdminProfile = async () => {
  try {
    const res = await getAdminInfo()
    if (res) {
      adminStore.setUserInfo(res)
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchAdminProfile()
})

const handleMenuClick = (key) => {
  activeMenu.value = key
}

const handleLogout = async () => {
  await adminLogout()
  adminStore.clearToken()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sider">
      <div class="brand">
        <div class="brand-logo">
          <el-icon :size="24">
            <DataBoard />
          </el-icon>
        </div>
        <span class="brand-text">JD Console</span>
      </div>

      <div class="menu-container">
        <el-menu :default-active="activeMenu" class="custom-menu" background-color="transparent"
          text-color="rgba(255,255,255,0.7)" active-text-color="#fff">
          <el-tooltip v-for="item in menus" :key="item.key" :content="item.label" placement="right" effect="dark"
            :enterable="false">
            <el-menu-item :index="item.key" @click="handleMenuClick(item.key)">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template #title>
                <span>{{ item.label }}</span>
              </template>
            </el-menu-item>
          </el-tooltip>
        </el-menu>
      </div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div class="page-info">
          <h1 class="page-title">
            {{menus.find(m => m.key === activeMenu)?.label || '运营控制台'}}
          </h1>
          <span class="page-subtitle">我很神秘</span>
        </div>

        <div class="user-area">
          <el-dropdown trigger="click">
            <div class="user-trigger">
              <el-avatar v-if="adminStore.userInfo.avatar" :src="adminStore.userInfo.avatar" :size="36"
                class="user-avatar" />
              <el-avatar v-else :size="36" class="user-avatar" :icon="UserFilled" />

              <div class="user-details">
                <span class="name">{{ userName }}</span>
              </div>
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item :icon="SwitchButton" divided @click="handleLogout" style="color: #f56c6c;">
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-area scrollbar-beauty">
        <transition name="fade-transform" mode="out-in">
          <keep-alive>
            <component :is="activeMenu === 'products' ? ProductPanel :
              (activeMenu === 'orders' ? OrderPanel :
                (activeMenu === 'categories' ? CategoryPanel : BannerPanel))
              " />
          </keep-alive>
        </transition>
      </main>
    </section>
  </div>
</template>

<style scoped>
/* 全局变量定义 */
:root {
  --primary-color: #00d2ff;
}

.admin-shell {
  display: flex;
  height: 100vh;
  /* 使用与登录页相同的深色渐变背景，作为最底层 */
  background: linear-gradient(135deg, #1a1c2c 0%, #4a192c 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- 侧边栏 (半透明) --- */
.sider {
  width: 240px;
  /* 背景改为半透明黑，配合模糊 */
  background: rgba(20, 20, 35, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.3s;
}

.brand {
  height: 72px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.brand-logo {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--primary-color), #3a7bd5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.menu-container {
  flex: 1;
  padding: 20px 10px;
  overflow-y: auto;
}

/* 菜单项样式 */
.custom-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 4px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  transform: translateX(5px);
  /* 悬浮微动效 */
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(0, 210, 255, 0.2) 0%, rgba(0, 210, 255, 0) 100%) !important;
  color: #fff !important;
  font-weight: 600;
  /* 左侧光条 */
  border-left: 3px solid var(--primary-color);
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
  margin-right: 12px;
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-menu-item.is-active .el-icon) {
  color: var(--primary-color);
}

/* --- 主工作区 --- */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 顶部导航栏 (半透明) */
.topbar {
  height: 72px;
  /* 极淡的白色半透明 */
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 90;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  /* 深色背景下改为白色文字 */
  margin: 0;
  letter-spacing: 0.5px;
}

.page-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
  display: block;
}

.user-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: transparent;
}

.user-details {
  margin: 0 10px;
}

.user-details .name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.content-area {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
  position: relative;
}

/* 滚动条美化 (深色模式适配) */
.scrollbar-beauty::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-beauty::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.scrollbar-beauty::-webkit-scrollbar-track {
  background-color: transparent;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>

<style>
.user-dropdown {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px) !important;
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3) !important;
  padding: 8px !important;
}

.el-dropdown-menu__item {
  border-radius: 8px;
  margin-bottom: 2px;
}

.el-dropdown-menu__item--divided {
  margin-top: 8px;
  border-top-color: rgba(0, 0, 0, 0.05) !important;
}
</style>