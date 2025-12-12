import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      // 遵循文档约定的 Token 格式
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

    // 0 表示成功，直接返回 data
    if (res.code === 0) {
      return res.data
    }

    // 40002: 登录失效或未登录
    if (res.code === 40002) {
      const userStore = useUserStore()
      userStore.clearToken()
      // 避免重复提示，可增加防抖逻辑，此处保持简单
      ElMessage.warning(res.message || '登录已过期，请重新登录')
      router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
      return Promise.reject(new Error(res.message))
    }

    // 40003: 无权限
    if (res.code === 40003) {
      ElMessage.error(res.message || '无权限访问')
      return Promise.reject(new Error(res.message))
    }

    // 40004: 库存不足 (购物车/下单场景)
    if (res.code === 40004) {
      ElMessage.warning(res.message || '商品库存不足')
      // 将错误对象抛出，便于组件（如 Cart.vue）捕获后回滚数量
      const error = new Error(res.message)
      error.code = 40004
      return Promise.reject(error)
    }

    // 其他业务错误
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
