import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCartList, updateCartItem, deleteCartItem, deleteCartItemsBatch } from '@/api/cart'
import { ElMessage } from 'element-plus'

export const useCartStore = defineStore('cart', () => {
  const cartList = ref([])
  const totalQuantity = ref(0)
  const totalAmount = ref(0)
  const loading = ref(false)

  // 获取购物车数据
  const fetchCart = async () => {
    loading.value = true
    try {
      const res = await getCartList()
      // res 结构: { items: [], totalQuantity: 0, totalAmount: 0 }
      cartList.value = res.items || []
      totalQuantity.value = res.totalQuantity || 0
      totalAmount.value = res.totalAmount || 0
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  // 修改数量
  const modifyQuantity = async (cartItemId, quantity) => {
    try {
      const res = await updateCartItem(cartItemId, quantity)
      // 接口直接返回更新后的完整购物车信息，直接覆盖
      cartList.value = res.items || []
      totalQuantity.value = res.totalQuantity || 0
      totalAmount.value = res.totalAmount || 0
    } catch (error) {
      // 错误抛出给组件处理（例如库存不足）
      return Promise.reject(error)
    }
  }

  // 删除单项
  const removeOne = async (cartItemId) => {
    try {
      await deleteCartItem(cartItemId)
      ElMessage.success('删除成功')
      await fetchCart() // 重新拉取最新状态
    } catch (error) {
      console.error(error)
    }
  }

  // 批量删除
  const removeBatch = async (ids) => {
    try {
      await deleteCartItemsBatch(ids)
      ElMessage.success('批量删除成功')
      await fetchCart()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    cartList,
    totalQuantity,
    totalAmount,
    loading,
    fetchCart,
    modifyQuantity,
    removeOne,
    removeBatch,
  }
})
