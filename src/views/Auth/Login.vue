<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { login } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, Right } from '@element-plus/icons-vue' // 引入 Right 箭头图标

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
    username: '',
    password: ''
})

const rules = {
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                const res = await login(form)
                userStore.setLoginState(res.token, res.user)
                ElMessage.success('登录成功')
                const redirect = route.query.redirect || '/'
                router.push(redirect)
            } catch (error) {
                console.error(error)
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<template>
    <div class="auth-container">
        <div class="banner-box">
            <div class="banner-bg"></div>
            <div class="banner-content">
                <div class="logo-text">JD.COM</div>
                <h2 class="slogan">多快好省<br>只为品质生活</h2>
            </div>
        </div>

        <div class="login-box">
            <div class="form-wrapper">
                <div class="header animate-item" style="--delay: 0.1s">
                    <div class="welcome">Welcome back</div>
                    <div class="title">账号登录</div>
                </div>

                <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large" class="login-form">

                    <el-form-item prop="username" class="animate-item" style="--delay: 0.2s">
                        <el-input v-model="form.username" placeholder="请输入账号 / 手机号" class="custom-input">
                            <template #prefix>
                                <el-icon class="input-icon">
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <el-form-item prop="password" class="animate-item" style="--delay: 0.3s">
                        <el-input v-model="form.password" type="password" show-password placeholder="请输入密码"
                            class="custom-input" @keyup.enter="handleLogin">
                            <template #prefix>
                                <el-icon class="input-icon">
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>

                    <div class="extras animate-item" style="--delay: 0.4s">
                        <el-checkbox label="记住我" size="small" />
                        <a href="#" class="forgot-pwd">忘记密码?</a>
                    </div>

                    <el-form-item class="animate-item" style="--delay: 0.5s">
                        <el-button type="primary" :loading="loading" @click="handleLogin" class="submit-btn">
                            立即登录 <el-icon class="el-icon--right">
                                <Right />
                            </el-icon>
                        </el-button>
                    </el-form-item>

                    <div class="footer animate-item" style="--delay: 0.6s">
                        还没有账号? <router-link to="/register" class="reg-link">立即注册</router-link>
                    </div>
                </el-form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    background-color: #fff;
    overflow: hidden;
}

/* ================= 左侧大图区域 ================= */
.banner-box {
    flex: 1.5;
    /* 60% 宽度 */
    position: relative;
    overflow: hidden;
    clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);
    /* 斜切造型 */
}

/* 背景图层：用于做缩放动画 */
.banner-bg {
    width: 100%;
    height: 100%;
    background: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop') no-repeat center center;
    background-size: cover;
    /* 核心动画：Ken Burns Effect (缓慢缩放) */
    animation: zoomEffect 20s infinite alternate linear;
}

/* 左侧文字层覆盖 */
.banner-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.6));
    /* 渐变遮罩 */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 60px;
    color: #fff;
    z-index: 2;
}

.logo-text {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 2px;
    font-family: 'Arial Black', sans-serif;
}

.slogan {
    font-size: 48px;
    font-weight: 300;
    line-height: 1.2;
    margin-bottom: 60px;
    /* 文字进场 */
    animation: fadeInUp 1s ease-out forwards;
}

/* ================= 右侧登录区域 ================= */
.login-box {
    flex: 1;
    /* 40% 宽度 */
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    position: relative;
    z-index: 1;
}

.form-wrapper {
    width: 100%;
    max-width: 400px;
    padding: 0 20px;
}

/* 标题样式 */
.welcome {
    font-size: 14px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.title {
    font-size: 32px;
    font-weight: 800;
    color: #333;
    margin-bottom: 40px;
}

/* --- 核心动画类：错落浮现 --- */
.animate-item {
    opacity: 0;
    /* 初始不可见 */
    transform: translateY(20px);
    /* 初始下移 */
    animation: fadeInUp 0.8s ease-out forwards;
    animation-delay: var(--delay);
    /* 根据内联样式延迟 */
}

/* 输入框美化 */
:deep(.custom-input .el-input__wrapper) {
    padding: 12px 15px;
    box-shadow: none !important;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
    transition: all 0.3s ease;
}

/* 输入框聚焦效果 */
:deep(.custom-input .el-input__wrapper.is-focus) {
    background-color: #fff;
    border-color: #e1251b;
    box-shadow: 0 4px 12px rgba(225, 37, 27, 0.1) !important;
    transform: translateY(-2px);
    /* 轻微上浮 */
}

.input-icon {
    font-size: 18px;
    color: #999;
}

/* 辅助行：记住我 & 忘记密码 */
.extras {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.forgot-pwd {
    font-size: 14px;
    color: #666;
    text-decoration: none;
}

.forgot-pwd:hover {
    color: #e1251b;
}

/* 按钮美化 */
.submit-btn {
    width: 100%;
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
    background-color: #e1251b;
    border: none;
    transition: all 0.3s;
}

.submit-btn:hover {
    background-color: #c81b12;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(225, 37, 27, 0.3);
}

.submit-btn:active {
    transform: translateY(0);
}

.footer {
    margin-top: 30px;
    text-align: center;
    font-size: 14px;
    color: #666;
}

.reg-link {
    color: #e1251b;
    font-weight: 600;
    text-decoration: none;
    margin-left: 5px;
    position: relative;
}

/* 注册链接下划线动效 */
.reg-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0%;
    height: 2px;
    background-color: #e1251b;
    transition: width 0.3s;
}

.reg-link:hover::after {
    width: 100%;
}

/* ================= 关键帧定义 ================= */

/* 向上浮现 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 背景缓慢缩放 */
@keyframes zoomEffect {
    0% {
        transform: scale(1);
    }

    100% {
        transform: scale(1.1);
    }
}
</style>