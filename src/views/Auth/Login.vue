<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { login } from '@/api/auth'
import { ElMessage } from 'element-plus'

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
                // res 是响应体中的 data 部分，包含 token, user 等字段
                userStore.setLoginState(res.token, res.user)
                ElMessage.success('登录成功')

                // 跳转回原页面或首页
                const redirect = route.query.redirect || '/'
                router.push(redirect)
            } catch (error) {
                // 错误处理交由 request.js
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<template>
    <div class="auth-container">
        <div class="auth-box">
            <div class="title">京东商城登录</div>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">

                <el-form-item prop="username">
                    <el-input v-model="form.username" placeholder="账号">
                        <template #prefix>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="form.password" type="password" show-password placeholder="密码"
                        @keyup.enter="handleLogin">
                        <template #prefix>
                            <el-icon>
                                <Lock />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleLogin" class="submit-btn">登录</el-button>
                </el-form-item>

                <div class="links">
                    <router-link to="/register">没有账号？免费注册</router-link>
                </div>
            </el-form>
        </div>
    </div>
</template>

<style scoped>
.auth-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f2f5;
    background: url('https://img10.360buyimg.com/img/jfs/t1/192028/25/33320/2735/63eb6b78F265a7d3a/12423456789.jpg') no-repeat center center;
    background-size: cover;
}

/* 遮罩层，为了让文字更清晰，如果背景图加载失败则使用备用色 */
.auth-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    /* 极淡的遮罩 */
    z-index: 0;
}

.auth-box {
    position: relative;
    z-index: 1;
    width: 360px;
    background: rgba(255, 255, 255, 0.95);
    padding: 40px;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 30px;
    color: #333;
}

.submit-btn {
    width: 100%;
    font-size: 16px;
}

.links {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 14px;
}

.links a {
    color: var(--el-color-primary);
}
</style>