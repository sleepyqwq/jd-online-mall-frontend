<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/adminStore'
import { adminLogin } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue'

const router = useRouter()
const adminStore = useAdminStore()
const loading = ref(false)
const formRef = ref()

const form = reactive({ username: '', password: '' })

// 1. 使用标准校验规则，替代手动 if 判断
const rules = {
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
    if (!formRef.value) return

    // 2. 调用 Element Plus 表单验证
    await formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            const res = await adminLogin(form)

            if (res.user.role !== 'ADMIN') {
                return ElMessage.error('权限不足，仅限管理员登录')
            }

            adminStore.setLoginState(res.token, res.user)
            ElMessage.success(`欢迎回来，${res.user.nickname || '管理员'}`)
            router.push('/admin/dashboard')
        } catch (e) {
            console.error(e)
        } finally {
            loading.value = false
        }
    })
}
</script>

<template>
    <div class="login-container">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>

        <div class="login-content">
            <div class="login-glass-card">
                <div class="header">
                    <div class="logo"><span class="logo-icon">JD</span></div>
                    <h2 class="title">Admin Console</h2>
                    <p class="subtitle">京东商城 · 运营管理系统</p>
                </div>

                <el-form ref="formRef" :model="form" :rules="rules" size="large" class="login-form"
                    @keyup.enter="handleLogin">
                    <el-form-item prop="username">
                        <el-input v-model="form.username" placeholder="管理员账号" :prefix-icon="User" class="glass-input" />
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock"
                            show-password class="glass-input" />
                    </el-form-item>
                    <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin" round>
                        立即登录 <el-icon class="el-icon--right">
                            <Right />
                        </el-icon>
                    </el-button>
                </el-form>

                <div class="footer">
                    <router-link to="/login" class="back-link">
                        <span class="arrow">←</span> 返回商城前台
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 容器与背景 */
.login-container {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1a1c2c 0%, #4a192c 100%);
    font-family: sans-serif;
}

/* 装饰球优化：提取公共属性 */
.shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    z-index: 0;
    animation: float 10s infinite ease-in-out alternate;
}

.shape-1 {
    top: -100px;
    left: -100px;
    width: 500px;
    height: 500px;
    background: #743ad5;
    opacity: 0.6;
}

.shape-2 {
    bottom: -150px;
    right: -100px;
    width: 600px;
    height: 600px;
    background: #d53a9d;
    opacity: 0.5;
    animation-delay: -5s;
}

.shape-3 {
    top: 40%;
    left: 40%;
    width: 300px;
    height: 300px;
    background: #00d2ff;
    opacity: 0.3;
    animation-duration: 15s;
}

@keyframes float {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }

    100% {
        transform: translate(30px, 50px) rotate(10deg);
    }
}

/* 毛玻璃卡片 */
.login-content {
    position: relative;
    z-index: 1;
}

.login-glass-card {
    width: 420px;
    padding: 50px 40px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    color: #fff;
    text-align: center;
}

/* 头部样式 */
.header {
    margin-bottom: 40px;
}

.logo {
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    border-radius: 12px;
    background: linear-gradient(135deg, #00d2ff, #3a7bd5);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.logo-icon {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: -1px;
}

.title {
    font-size: 28px;
    margin: 0 0 10px;
    font-weight: 700;
    letter-spacing: 1px;
}

.subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-weight: 300;
}

/* 表单与输入框样式穿透 */
.login-form {
    margin-top: 20px;
}

:deep(.glass-input .el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.2) !important;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none !important;
    border-radius: 30px;
    padding: 0 20px;
    transition: all 0.3s;
}

:deep(.glass-input .el-input__wrapper.is-focus) {
    background-color: rgba(0, 0, 0, 0.3) !important;
    border-color: #00d2ff !important;
}

:deep(.glass-input .el-input__inner) {
    color: #fff !important;
    height: 48px;
}

:deep(.glass-input .el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.4);
}

:deep(.glass-input .el-input__icon) {
    color: rgba(255, 255, 255, 0.6);
}

/* 按钮 */
.submit-btn {
    width: 100%;
    height: 48px;
    margin-top: 10px;
    background: linear-gradient(90deg, #00d2ff, #3a7bd5);
    border: none;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    box-shadow: 0 8px 20px rgba(58, 123, 213, 0.4);
    transition: all 0.3s;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(58, 123, 213, 0.5);
    background: linear-gradient(90deg, #00c6f0, #326ec2);
}

.submit-btn:active {
    transform: translateY(0);
}

/* 底部 */
.footer {
    margin-top: 30px;
}

.back-link {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 13px;
    transition: 0.3s;
    display: inline-flex;
    align-items: center;
}

.back-link:hover {
    color: #fff;
}

.back-link:hover .arrow {
    transform: translateX(-3px);
}

.arrow {
    margin-right: 5px;
    transition: 0.3s;
}
</style>