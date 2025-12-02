import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 这里利用 Vite 的代理或直接指向后端地址，根据开发环境配置
  timeout: 10000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    // 如果存在 token，则添加到请求头
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data

    // 约定 code 为 0 表示成功
    if (res.code === 0) {
      return res.data // 直接返回 data 里的内容，简化组件调用
    }

    // 处理特定业务错误码
    if (res.code === 40002) {
      // 登录失效或未登录
      const userStore = useUserStore()
      userStore.clearToken()
      ElMessage.warning(res.message || '登录已过期，请重新登录')
      // 跳转到登录页，并记录当前页面路径以便登录后重定向
      router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
      return Promise.reject(new Error(res.message))
    }

    // 其他业务错误，统一提示
    ElMessage.error(res.message || '系统繁忙，请稍后重试')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error) => {
    // 处理 HTTP 状态码错误
    let message = '网络请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `连接错误 ${error.response.status}`
      }
    }
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

export default service
