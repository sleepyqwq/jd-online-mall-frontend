<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useCartStore } from '@/stores/cartStore'
import { logout } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Search,
    ShoppingCart,
    User,
    List,
    Delete
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const keyword = ref('')
const searchHistory = ref([])

// --- 历史搜索逻辑 ---
const HISTORY_KEY = 'jd_mall_search_history'

const loadHistory = () => {
    const json = localStorage.getItem(HISTORY_KEY)
    if (json) {
        searchHistory.value = JSON.parse(json)
    }
}

const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem(HISTORY_KEY)
}

const handleHistoryClick = (tag) => {
    keyword.value = tag
    handleSearch()
}

const handleSearch = () => {
    const val = keyword.value.trim()
    if (!val) {
        router.push('/products')
        return
    }
    const newHistory = [val, ...searchHistory.value.filter(item => item !== val)].slice(0, 5)
    searchHistory.value = newHistory
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
    router.push({ path: '/products', query: { keyword: val } })
}

// --- 用户与购物车逻辑 ---
const userAvatar = computed(() => userStore.userInfo?.avatar || '')
const nickName = computed(() => {
    if (!userStore.token) return '请登录'
    return userStore.userInfo?.nickname || userStore.userInfo?.username || '用户'
})

const handleLogout = async () => {
    try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning', center: true })
        try { await logout() } catch (e) { }

        userStore.clearToken()
        // 退出时清空购物车显示
        cartStore.totalQuantity = 0
        cartStore.cartList = []

        ElMessage.success('已安全退出')
        router.push('/login')
    } catch (e) { }
}

const handleUserClick = () => {
    if (!userStore.token) {
        router.push('/login')
    }
}

// 监听 Token，登录后拉取购物车
watch(() => userStore.token, (newToken) => {
    if (newToken) {
        cartStore.fetchCart()
    } else {
        cartStore.totalQuantity = 0
    }
})

onMounted(() => {
    loadHistory()
    if (userStore.token) {
        cartStore.fetchCart()
    }
})
</script>

<template>
    <header class="app-header">
        <div class="top-bar">
            <div class="container top-bar-inner">
                <div class="left-entry">
                    <span class="location-text">欢迎光临 JD Mall 商城</span>
                </div>
                <div class="right-entry">
                    <template v-if="!userStore.token">
                        <router-link to="/login" class="nav-link">登录</router-link>
                        <span class="divider">|</span>
                        <router-link to="/register" class="nav-link">免费注册</router-link>
                    </template>
                    <template v-else>
                        <a href="javascript:;" class="nav-link">帮助中心</a>
                        <span class="divider">|</span>
                        <a href="javascript:;" class="nav-link">关于我们</a>
                    </template>
                </div>
            </div>
        </div>

        <div class="main-header">
            <div class="container main-header-inner">

                <div class="logo-wrapper" @click="router.push('/')">
                    <div class="logo-icon">JD</div>
                    <div class="logo-text">
                        <span class="main-title">商城</span>
                        <span class="sub-title">多快好省 · 品质保障</span>
                    </div>
                </div>

                <div class="search-section">
                    <div class="search-box-wrapper">
                        <input v-model="keyword" type="text" class="search-input" placeholder="搜索你想要的商品..."
                            @keyup.enter="handleSearch" />
                        <button class="search-btn" @click="handleSearch">
                            <el-icon>
                                <Search />
                            </el-icon>
                        </button>
                    </div>

                    <div class="history-bar" v-if="searchHistory.length > 0">
                        <span class="history-label">历史搜索：</span>
                        <span v-for="tag in searchHistory" :key="tag" class="history-tag"
                            @click="handleHistoryClick(tag)">
                            {{ tag }}
                        </span>
                        <span class="clear-history" @click="clearHistory" title="清空历史">
                            <el-icon>
                                <Delete />
                            </el-icon>
                        </span>
                    </div>
                </div>

                <div class="action-section">

                    <div class="action-item user-action">
                        <el-dropdown trigger="hover" :disabled="!userStore.token" class="no-outline">
                            <div class="action-content" @click="handleUserClick">
                                <el-avatar :size="36" :src="userAvatar" :icon="User" class="nav-avatar" />
                                <div class="action-text">
                                    <span class="small-label">你好,</span>
                                    <span class="big-label">{{ nickName }}</span>
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

                    <div class="action-item" @click="router.push('/orders')">
                        <div class="icon-box">
                            <el-icon>
                                <List />
                            </el-icon>
                        </div>
                        <div class="action-text">
                            <span class="small-label">交易管理</span>
                            <span class="big-label">我的订单</span>
                        </div>
                    </div>

                    <div class="action-item cart-action" @click="router.push('/cart')">
                        <div class="cart-icon-wrapper">
                            <el-icon :size="28">
                                <ShoppingCart />
                            </el-icon>
                            <span class="cart-badge">{{ cartStore.totalQuantity }}</span>
                        </div>
                        <div class="action-text">
                            <span class="small-label">当前购入</span>
                            <span class="big-label">购物车</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
/* --- 基础样式 --- */
.app-header {
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    position: relative;
    z-index: 1000;
}

.top-bar {
    background-color: #333;
    color: #b0b0b0;
    height: 32px;
    font-size: 12px;
    line-height: 32px;
}

.top-bar-inner {
    display: flex;
    justify-content: space-between;
}

.nav-link {
    color: #b0b0b0;
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
}

.nav-link:hover {
    color: #fff;
}

.divider {
    margin: 0 10px;
    color: #555;
}

.main-header {
    padding: 20px 0;
}

.main-header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
}

/* --- Logo 区域 (包含您喜欢的动画) --- */
.logo-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-right: 40px;
    /* 关键：添加平滑过渡动画 */
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

/* 悬停时的缩放效果 */
.logo-wrapper:hover {
    transform: scale(1.05);
}

.logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #e4393c 0%, #ff6b6b 100%);
    color: #fff;
    font-size: 24px;
    font-weight: 900;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    margin-right: 12px;
    /* 给图标也加一点点阴影 */
    box-shadow: 0 4px 12px rgba(228, 57, 60, 0.3);
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
    margin-bottom: 2px;
}

.sub-title {
    font-size: 12px;
    color: #999;
    letter-spacing: 1px;
}

/* --- 搜索框区域 --- */
.search-section {
    flex: 1;
    max-width: 580px;
    margin-right: 40px;
}

.search-box-wrapper {
    display: flex;
    height: 38px;
    border: 2px solid #e4393c;
    border-radius: 20px;
    overflow: hidden;
    transition: box-shadow 0.2s;
}

.search-box-wrapper:focus-within {
    box-shadow: 0 0 0 3px rgba(228, 57, 60, 0.1);
}

.search-input {
    flex: 1;
    border: none;
    padding: 0 20px;
    font-size: 14px;
    outline: none;
}

.search-btn {
    width: 70px;
    background: #e4393c;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}

.search-btn:hover {
    background: #d63033;
}

.history-bar {
    margin-top: 6px;
    font-size: 12px;
    color: #999;
    padding-left: 10px;
    display: flex;
    align-items: center;
    height: 20px;
}

.history-label {
    margin-right: 5px;
}

.history-tag {
    background: #f4f4f4;
    padding: 0 6px;
    border-radius: 2px;
    margin-right: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #666;
}

.history-tag:hover {
    color: #e4393c;
    background: #fcebeb;
}

.clear-history {
    margin-left: auto;
    cursor: pointer;
    padding: 2px;
}

.clear-history:hover {
    color: #e4393c;
}

/* --- 右侧功能区 --- */
.action-section {
    display: flex;
    align-items: center;
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
    /* 确保内容区本身无边框 */
}

/* 修改点2: 强制移除 el-dropdown 的聚焦边框 */
.no-outline {
    outline: none !important;
}

/* 使用 :deep 选择器穿透，移除 Element Plus 内部触发器的边框 */
.no-outline :deep(.el-tooltip__trigger) {
    outline: none !important;
}

.action-text {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
    justify-content: center;
}

.small-label {
    font-size: 12px;
    color: #999;
    line-height: 1.2;
}

.big-label {
    font-size: 14px;
    font-weight: bold;
    color: #333;
    line-height: 1.2;
}

.nav-avatar {
    background: #f2f2f2;
    border: 1px solid #eee;
}

.icon-box {
    font-size: 24px;
    color: #333;
}

.cart-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    padding-right: 6px;
}

.cart-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #e4393c;
    color: #fff;
    font-size: 12px;
    font-weight: normal;
    height: 16px;
    min-width: 16px;
    line-height: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 4px;
    border: 2px solid #fff;
    box-sizing: content-box;
}

/* --- 动画关键帧定义 --- */

/* 1. 购物车动画：模拟小车行进时的轻微晃动 */
@keyframes cart-wobble {
    0% {
        transform: translateX(0) rotate(0);
    }

    25% {
        transform: translateX(-2px) rotate(-6deg);
    }

    50% {
        transform: translateX(2px) rotate(6deg);
    }

    75% {
        transform: translateX(-1px) rotate(-3deg);
    }

    100% {
        transform: translateX(0) rotate(0);
    }
}

/* 2. 订单/清单动画：模拟纸张或图标轻微的Q弹放大 */
@keyframes list-pop {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.2);
    }

    100% {
        transform: scale(1);
    }
}

/* --- 应用动画到具体图标 --- */

/* 针对“我的订单”图标：鼠标悬停时，图标变红并Q弹一下 */
.action-item:hover .icon-box .el-icon {
    color: #e4393c;
    /* 变京东红 */
    animation: list-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 针对“购物车”图标：鼠标悬停时，图标变红并晃动 */
.cart-action:hover .cart-icon-wrapper .el-icon {
    color: #e4393c;
    /* 变京东红 */
    animation: cart-wobble 0.5s ease-in-out;
}

/* 额外优化：为了让颜色变化更丝滑，建议给原图标类添加过渡属性 (可选) */
.icon-box .el-icon,
.cart-icon-wrapper .el-icon {
    transition: color 0.2s;
}
</style>