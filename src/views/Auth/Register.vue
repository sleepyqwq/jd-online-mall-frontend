<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register, uploadFile } from '@/api/auth'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    avatar: ''
})

// 表单校验规则
const rules = {
    username: [
        // "username 登录账号，必填，需校验唯一" - 移除了长度限制
        { required: true, message: '请输入账号', trigger: 'blur' }
    ],
    password: [
        // "password 登录密码，必填" - 保留最少位数限制以保证安全性，虽文档未明说但属常规UI交互
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== form.password) {
                    callback(new Error('两次输入密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: 'blur'
        }
    ],
    nickname: [
        { required: false, message: '请输入昵称', trigger: 'blur' } // 文档标注为可选
    ]
}

// 自定义上传方法
const customRequest = async (options) => {
    try {
        const res = await uploadFile(options.file)
        // 后端返回 { url: '/images/...', fullUrl: 'http://...' }
        // 存储 url (相对路径) 以便存入数据库，前端靠代理访问
        form.avatar = res.url
        ElMessage.success('头像上传成功')
    } catch (error) {
        ElMessage.error('头像上传失败')
    }
}

// 提交注册
const handleRegister = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                // 三、1.(1) 用户注册接口
                await register({
                    username: form.username,
                    password: form.password,
                    nickname: form.nickname,
                    avatar: form.avatar
                })
                ElMessage.success('注册成功，请登录')
                router.push('/login')
            } catch (error) {
                // 错误已在 request.js 中统一处理
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
            <div class="title">用户注册</div>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" status-icon>

                <el-form-item label="头像" prop="avatar">
                    <el-upload class="avatar-uploader" action="#" :http-request="customRequest" :show-file-list="false"
                        accept="image/*">
                        <img v-if="form.avatar" :src="form.avatar" class="avatar" />
                        <el-icon v-else class="avatar-uploader-icon">
                            <Plus />
                        </el-icon>
                    </el-upload>
                </el-form-item>

                <el-form-item label="账号" prop="username">
                    <el-input v-model="form.username" placeholder="请输入登录账号" />
                </el-form-item>

                <el-form-item label="昵称" prop="nickname">
                    <el-input v-model="form.nickname" placeholder="请输入昵称" />
                </el-form-item>

                <el-form-item label="密码" prop="password">
                    <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
                </el-form-item>

                <el-form-item label="确认密码" prop="confirmPassword">
                    <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入密码" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="handleRegister"
                        class="submit-btn">立即注册</el-button>
                </el-form-item>

                <div class="links">
                    <router-link to="/login">已有账号？去登录</router-link>
                </div>
            </el-form>
        </div>
    </div>
</template>

<style scoped>
/* 样式保持不变 */
.auth-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f2f5;
    background-image: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%);
}

.auth-box {
    width: 400px;
    background: #fff;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #333;
}

.submit-btn {
    width: 100%;
}

.links {
    text-align: right;
    margin-top: 10px;
    font-size: 14px;
}

.links a {
    color: var(--el-color-primary);
}

.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
    border: 1px dashed #d9d9d9;
}

.avatar {
    width: 100px;
    height: 100px;
    display: block;
    object-fit: cover;
}
</style>