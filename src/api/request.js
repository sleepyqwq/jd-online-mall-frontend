import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { useAdminStore } from '@/stores/adminStore' // 引入新建的 adminStore
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 【关键逻辑】根据请求路径判断使用哪个 Token
    const url = config.url || ''

    // 如果是请求后台管理接口 (以 /admin 开头)
    if (url.startsWith('/admin') || (config.baseURL + url).includes('/api/admin')) {
      const adminStore = useAdminStore()
      if (adminStore.token) {
        config.headers.Authorization = `Bearer ${adminStore.token}`
      }
    } else {
      // 否则是前台商城接口
      const userStore = useUserStore()
      if (userStore.token) {
        config.headers.Authorization = `Bearer ${userStore.token}`
      }
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

    if (res.code === 0) {
      return res.data
    }

    // 40002: 登录失效
    if (res.code === 40002) {
      const url = response.config.url || ''
      const isBackend = url.startsWith('/admin') || url.includes('/api/admin')

      if (isBackend) {
        // 后台失效，清理后台状态，跳后台登录
        const adminStore = useAdminStore()
        adminStore.clearToken()
        ElMessage.warning('管理员登录已过期')
        router.push('/admin/login')
      } else {
        // 前台失效，清理前台状态，跳前台登录
        const userStore = useUserStore()
        userStore.clearToken()
        ElMessage.warning('登录已过期，请重新登录')
        router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
      }
      return Promise.reject(new Error(res.message))
    }

    if (res.code === 40003) {
      ElMessage.error(res.message || '无权限访问')
      return Promise.reject(new Error(res.message))
    }

    if (res.code === 40004) {
      ElMessage.warning(res.message || '商品库存不足')
      const error = new Error(res.message)
      error.code = 40004
      return Promise.reject(error)
    }

    ElMessage.error(res.message || '系统繁忙，请稍后重试')
    return Promise.reject(new Error(res.message))
  },
  (error) => {
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
