<script setup>
import { ref, computed, watch } from 'vue' // 移除了 onMounted
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'
import { logout } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ShoppingCart, User, List, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

// --- 搜索逻辑 ---
const keyword = ref('')
const searchHistory = ref([])
const HISTORY_KEY = 'jd_mall_search_history'

// 初始化加载历史
const historyJson = localStorage.getItem(HISTORY_KEY)
if (historyJson) searchHistory.value = JSON.parse(historyJson)

const handleSearch = (val) => {
    // 允许传入 val (点击历史标签时)，否则取输入框的值
    const query = (typeof val === 'string' ? val : keyword.value).trim()
    keyword.value = query // 同步输入框

    if (!query) return router.push('/products')

    // 使用 Set 去重并截取前5个
    const newHistory = [query, ...searchHistory.value.filter(h => h !== query)].slice(0, 5)
    searchHistory.value = newHistory
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))

    router.push({ path: '/products', query: { keyword: query } })
}

const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem(HISTORY_KEY)
}

// --- 用户与购物车逻辑 ---
// 简化 Computed
const userAvatar = computed(() => userStore.userInfo?.avatar || '')
const nickName = computed(() => userStore.token ? (userStore.userInfo?.nickname || userStore.userInfo?.username || '用户') : '请登录')

// 统一处理鉴权点击
const handleAuthAction = (action) => {
    if (!userStore.token) return router.push('/login')
    action && action()
}

const handleLogout = async () => {
    try {
        await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning', center: true })
        await logout().catch(() => { }) // 忽略登出接口报错
        userStore.clearToken()
        // 状态重置交给 watch 自动处理
        ElMessage.success('已安全退出')
        router.push('/login')
    } catch (e) { }
}

// --- 核心优化：合并 onMounted 和 watch ---
// immediate: true 确保组件加载时立即执行一次，替代 onMounted
watch(() => userStore.token, (token) => {
    if (token) {
        cartStore.fetchCart()
    } else {
        cartStore.totalQuantity = 0
        cartStore.cartList = []
    }
}, { immediate: true })
</script>

<template>
    <header class="app-header">
        <div class="container header-inner">
            <div class="logo-wrapper" @click="router.push('/')">
                <div class="logo-icon">JD</div>
                <div class="logo-text">
                    <span class="main-title">商城</span>
                    <span class="sub-title">多快好省 · 品质保障</span>
                </div>
            </div>

            <div class="search-section">
                <div class="search-box">
                    <input v-model="keyword" class="search-input" placeholder="搜索商品..." @keyup.enter="handleSearch" />
                    <button class="search-btn" @click="handleSearch">
                        <el-icon>
                            <Search />
                        </el-icon>
                    </button>
                </div>

                <div class="history-bar" v-if="searchHistory.length">
                    <span>历史：</span>
                    <span v-for="tag in searchHistory" :key="tag" class="tag" @click="handleSearch(tag)">
                        {{ tag }}
                    </span>
                    <el-icon class="clear-btn" @click="clearHistory" title="清空">
                        <Delete />
                    </el-icon>
                </div>
            </div>

            <div class="action-section">
                <div class="action-item user-action">
                    <el-dropdown trigger="hover" :disabled="!userStore.token" class="custom-dropdown">
                        <div class="action-content" @click="handleAuthAction(null)">
                            <el-avatar :size="36" :src="userAvatar" :icon="User" class="avatar" />
                            <div class="text-col">
                                <span class="sub">你好,</span>
                                <span class="main">{{ nickName }}</span>
                            </div>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="router.push('/address')">收货地址</el-dropdown-item>
                                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>

                <div class="action-item" @click="handleAuthAction(() => router.push('/orders'))">
                    <el-icon :size="24">
                        <List />
                    </el-icon>
                    <div class="text-col">
                        <span class="sub">交易管理</span>
                        <span class="main">我的订单</span>
                    </div>
                </div>

                <div class="action-item cart-item" @click="handleAuthAction(() => router.push('/cart'))">
                    <div class="cart-icon">
                        <el-icon :size="28">
                            <ShoppingCart />
                        </el-icon>
                        <span class="badge">{{ cartStore.totalQuantity }}</span>
                    </div>
                    <div class="text-col">
                        <span class="sub">当前购入</span>
                        <span class="main">购物车</span>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
/* 布局与通用 */
.app-header {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 20px 0;
    position: relative;
    z-index: 1000;
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
}

/* Logo */
.logo-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-right: 40px;
    transition: transform 0.2s;
}

.logo-wrapper:hover {
    transform: scale(1.05);
}

.logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #e4393c, #ff6b6b);
    color: #fff;
    font-size: 24px;
    font-weight: 900;
    display: grid;
    place-items: center;
    border-radius: 8px;
    margin-right: 12px;
}

.logo-text {
    display: flex;
    flex-direction: column;
}

.main-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    line-height: 1;
}

.sub-title {
    font-size: 12px;
    color: #999;
    letter-spacing: 1px;
}

/* 搜索框 */
.search-section {
    flex: 1;
    max-width: 580px;
    margin-right: 40px;
}

.search-box {
    display: flex;
    height: 38px;
    border: 2px solid #e4393c;
    border-radius: 20px;
    overflow: hidden;
    transition: box-shadow 0.2s;
}

.search-box:focus-within {
    box-shadow: 0 0 0 3px rgba(228, 57, 60, 0.1);
}

.search-input {
    flex: 1;
    border: none;
    padding: 0 20px;
    outline: none;
}

.search-btn {
    width: 70px;
    background: #e4393c;
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
}

.search-btn:hover {
    background: #d63033;
}

/* 历史记录 */
.history-bar {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
    padding-left: 10px;
    display: flex;
    align-items: center;
}

.tag {
    background: #f4f4f4;
    padding: 0 6px;
    border-radius: 2px;
    margin: 0 4px;
    cursor: pointer;
    transition: 0.2s;
    color: #666;
}

.tag:hover {
    color: #e4393c;
    background: #fcebeb;
}

.clear-btn {
    margin-left: auto;
    cursor: pointer;
}

.clear-btn:hover {
    color: #e4393c;
}

/* 右侧操作区 */
.action-section {
    display: flex;
    gap: 20px;
}

.action-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: background 0.2s;
    color: #333;
}

.action-item:hover {
    background: #f8f8f8;
}

.action-content {
    display: flex;
    align-items: center;
    outline: none;
}

.text-col {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
    justify-content: center;
}

.sub {
    font-size: 12px;
    color: #999;
    line-height: 1.2;
}

.main {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    line-height: 1.2;
}

.avatar {
    background: #f2f2f2;
    border: 1px solid #eee;
}

/* 购物车图标 */
.cart-icon {
    position: relative;
    padding-right: 6px;
    display: flex;
}

.badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #e4393c;
    color: #fff;
    font-size: 12px;
    padding: 0 4px;
    border-radius: 10px;
    height: 16px;
    min-width: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #fff;
}

/* 动画 */
@keyframes list-pop {
    50% {
        transform: scale(1.2);
    }
}

@keyframes cart-wobble {
    25% {
        transform: rotate(-6deg);
    }

    50% {
        transform: rotate(6deg);
    }

    75% {
        transform: rotate(-3deg);
    }
}

.action-item:hover .el-icon {
    color: #e4393c;
    animation: list-pop 0.4s;
}

.cart-item:hover .el-icon {
    animation: cart-wobble 0.5s;
}

.el-icon {
    transition: color 0.2s;
}

/* === 核心修复：未登录状态鼠标手型 === */
.user-action :deep(.el-dropdown.is-disabled) {
    cursor: pointer;
}

.user-action :deep(.el-dropdown.is-disabled .action-content) {
    cursor: pointer;
    color: inherit;
}

.custom-dropdown :deep(.el-tooltip__trigger) {
    outline: none;
}
</style>