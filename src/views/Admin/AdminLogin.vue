<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { adminLogin } from '@/api/admin'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({
    username: '',
    password: ''
})

const handleLogin = async () => {
    if (!form.username || !form.password) {
        return ElMessage.warning('请输入账号和密码')
    }

    loading.value = true
    try {
        // 调用管理员登录接口
        const res = await adminLogin(form)

        // 校验角色（双重保险，防止普通用户误登后台）
        if (res.user.role !== 'ADMIN') {
            ElMessage.error('该账号没有管理员权限')
            return
        }

        // 保存状态
        userStore.setLoginState(res.token, res.user)
        ElMessage.success('管理员登录成功')

        // 跳转到后台首页
        router.push('/admin/dashboard')
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="admin-login-container">
        <div class="login-box">
            <div class="header">
                <h2>JD Mall 管理后台</h2>
                <p>系统管理员登录</p>
            </div>

            <el-form size="large">
                <el-form-item>
                    <el-input v-model="form.username" placeholder="管理员账号" prefix-icon="User" />
                </el-form-item>
                <el-form-item>
                    <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password
                        @keyup.enter="handleLogin" />
                </el-form-item>
                <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
                    登 录
                </el-button>
            </el-form>

            <div class="back-link">
                <router-link to="/login">← 返回商城用户登录</router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
}

.login-box {
    width: 400px;
    padding: 44px 36px 36px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 14px 38px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(4px);
}

.header {
    text-align: center;
    margin-bottom: 30px;
}

.header h2 {
    margin: 0 0 10px;
    color: #1f2937;
}

.header p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
}

.submit-btn {
    width: 100%;
}

.back-link {
    margin-top: 20px;
    text-align: center;
    font-size: 14px;
}

.back-link a {
    color: #4b5563;
    text-decoration: none;
}

.back-link a:hover {
    color: #409eff;
}
</style>
