// src/stores/userStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY_TOKEN = 'token'
const STORAGE_KEY_USER = 'userInfo'

function loadUserInfo() {
  const raw = localStorage.getItem(STORAGE_KEY_USER)

  // 1. 为空、"undefined"、"null" 等情况，一律按没有数据处理
  if (!raw || raw === 'undefined' || raw === 'null') {
    return {}
  }

  try {
    const obj = JSON.parse(raw)
    // 确保解析结果为对象
    if (obj && typeof obj === 'object') {
      return obj
    }
    // 解析出来不是对象，也当作无数据
    return {}
  } catch (e) {
    console.error('[userStore] 解析 userInfo 失败, 原始值 =', raw, e)
    // 防止下次继续出错，直接把脏数据清掉
    localStorage.removeItem(STORAGE_KEY_USER)
    return {}
  }
}

export const useUserStore = defineStore('user', () => {
  // token 允许为空字符串
  const token = ref(localStorage.getItem(STORAGE_KEY_TOKEN) || '')
  const userInfo = ref(loadUserInfo())

  const isLogin = computed(() => !!token.value)

  // 设置登录态
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

  // 更新用户信息
  const setUserInfo = (info) => {
    userInfo.value = info || {}
    if (Object.keys(userInfo.value).length > 0) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo.value))
    } else {
      localStorage.removeItem(STORAGE_KEY_USER)
    }
  }

  // 清除登录态
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
