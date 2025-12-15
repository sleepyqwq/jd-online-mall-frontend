import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 【关键修改】使用独立的 Key，与前台用户区分开
const STORAGE_KEY_TOKEN = 'admin_token'
const STORAGE_KEY_USER = 'admin_userInfo'

function loadUserInfo() {
  const raw = localStorage.getItem(STORAGE_KEY_USER)
  if (!raw || raw === 'undefined' || raw === 'null') {
    return {}
  }
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object') {
      return obj
    }
    return {}
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY_USER)
    return {}
  }
}

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem(STORAGE_KEY_TOKEN) || '')
  const userInfo = ref(loadUserInfo())

  const isLogin = computed(() => !!token.value)

  const setLoginState = (newToken, newUserInfo) => {
    token.value = newToken || ''
    userInfo.value = newUserInfo || {}

    if (token.value) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token.value)
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN)
    }

    if (Object.keys(userInfo.value).length > 0) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo.value))
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
    }
  }

  const setUserInfo = (info) => {
    userInfo.value = info || {}
    if (Object.keys(userInfo.value).length > 0) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo.value))
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
    }
  }

  const clearToken = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_USER)
  }

  return {
    token,
    userInfo,
    isLogin,
    setLoginState,
    setUserInfo,
    clearToken,
  }
})
