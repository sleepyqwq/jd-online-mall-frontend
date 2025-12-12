<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { adminLogout, getAdminInfo } from '@/api/admin'
import ProductPanel from './components/ProductPanel.vue'
import CategoryPanel from './components/CategoryPanel.vue'
import OrderPanel from './components/OrderPanel.vue'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('products')

const menus = [
  { key: 'products', label: '商品管理', icon: 'Goods' },
  { key: 'orders', label: '订单管理', icon: 'List' },
  { key: 'categories', label: '分类管理', icon: 'Menu' },
]

const userName = computed(() => userStore.userInfo.nickname || userStore.userInfo.username || '管理员')

const fetchAdminProfile = async () => {
  try {
    const res = await getAdminInfo()
    if (res) {
      userStore.setUserInfo(res)
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
  userStore.clearToken()
  router.push('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sider">
      <div class="brand">
        <el-icon>
          <DataBoard />
        </el-icon>
        <span>JD Mall 后台</span>
      </div>
      <el-menu :default-active="activeMenu" class="menu" background-color="#0f172a" text-color="#cbd5e1"
        active-text-color="#fff">
        <el-menu-item v-for="item in menus" :key="item.key" :index="item.key"
          :class="{ active: activeMenu === item.key }" @click="handleMenuClick(item.key)">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <div class="title">运营控制台</div>
          <div class="subtitle">对照接口文档&需求分析，快速验收联调</div>
        </div>
        <div class="user-box">
          <el-avatar :src="userStore.userInfo.avatar" size="small" />
          <span class="name">{{ userName }}</span>
          <el-button link type="danger" @click="handleLogout">退出</el-button>
        </div>
      </header>

      <main class="content-area">
        <ProductPanel v-if="activeMenu === 'products'" />
        <OrderPanel v-else-if="activeMenu === 'orders'" />
        <CategoryPanel v-else />
      </main>
    </section>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sider {
  width: 220px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(6px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menu {
  border-right: none;
  flex: 1;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 72px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name {
  font-weight: 600;
}

.content-area {
  padding: 18px 20px 24px;
  flex: 1;
  overflow-y: auto;
}
</style>
