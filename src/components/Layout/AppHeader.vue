<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { logout } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')

// 搜索功能（仅做路由跳转演示，参数传递在商品列表页实现）
const handleSearch = () => {
    if (keyword.value.trim()) {
        router.push({ path: '/products', query: { keyword: keyword.value } })
    } else {
        router.push('/products')
    }
}

// 退出登录
const handleLogout = async () => {
    try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        })

        await logout() // 调用后端退出接口
        userStore.clearToken() // 清除前端状态
        ElMessage.success('退出成功')
        router.push('/login')
    } catch (error) {
        if (error !== 'cancel') {
            console.error(error)
            // 即使后端接口失败，前端也要清理状态
            userStore.clearToken()
            router.push('/login')
        }
    }
}
</script>

<template>
    <header class="app-header">
        <div class="container header-content">
            <div class="logo" @click="router.push('/')">
                <h1>JD Mall</h1>
            </div>

            <div class="search-bar">
                <el-input v-model="keyword" placeholder="搜索商品..." class="search-input" @keyup.enter="handleSearch">
                    <template #append>
                        <el-button @click="handleSearch">搜索</el-button>
                    </template>
                </el-input>
            </div>

            <div class="user-actions">
                <template v-if="!userStore.token">
                    <router-link to="/login" class="link">你好，请登录</router-link>
                    <router-link to="/register" class="link highlight">免费注册</router-link>
                </template>

                <template v-else>
                    <el-dropdown>
                        <span class="el-dropdown-link user-info">
                            <el-avatar :size="30" :src="userStore.userInfo.avatar || ''" class="avatar-icon" />
                            <span class="username">{{ userStore.userInfo.nickname || userStore.userInfo.username
                                }}</span>
                            <el-icon class="el-icon--right"><arrow-down /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item @click="router.push('/orders')">我的订单</el-dropdown-item>
                                <el-dropdown-item @click="router.push('/address')">收货地址</el-dropdown-item>
                                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </template>

                <div class="cart-entry" @click="router.push('/cart')">
                    <el-badge :value="0" :max="99" class="cart-badge" hidden>
                        <el-button type="primary" link>
                            <el-icon :size="20">
                                <ShoppingCart />
                            </el-icon>
                            <span>我的购物车</span>
                        </el-button>
                    </el-badge>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    background-color: #fff;
    border-bottom: 1px solid #ddd;
    height: 80px;
    display: flex;
    align-items: center;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    cursor: pointer;
    color: var(--el-color-primary);
    font-style: italic;
}

.search-bar {
    flex: 1;
    max-width: 500px;
    margin: 0 40px;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: 14px;
}

.link {
    color: #666;
    margin-right: 10px;
}

.link:hover {
    color: var(--el-color-primary);
}

.highlight {
    color: var(--el-color-primary);
}

.user-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #666;
}

.avatar-icon {
    margin-right: 8px;
    background-color: #ccc;
}

.cart-entry {
    cursor: pointer;
    margin-left: 10px;
}

.cart-entry span {
    margin-left: 5px;
    font-weight: bold;
}
</style>