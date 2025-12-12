import request from './request'

// 处理数量变更
const handleQuantityChange = async (value, row) => {
  if (!value) return

  // 保存修改前的旧值，用于回滚
  const oldValue = row.quantity

  try {
    await cartStore.modifyQuantity(row.cartItemId, value)
  } catch (error) {
    // 如果是库存不足 (code 40004)，回滚数量
    if (error.code === 40004) {
      // 需要重新赋值触发响应式更新，稍微延迟以确保 UI 刷新
      row.quantity = oldValue
      // 重新拉取一次购物车以确保数据一致性
      await cartStore.fetchCart()
    } else {
      console.error(error)
    }
  }
}

// 添加商品到购物车
export const addToCart = (data) => {
  // data: { productId, quantity }
  return request({
    url: '/cart/items',
    method: 'post',
    data,
  })
}

// 获取购物车列表
export const getCartList = () => {
  return request({
    url: '/cart',
    method: 'get',
  })
}

// 修改购物车商品数量
export const updateCartItem = (cartItemId, quantity) => {
  return request({
    url: `/cart/items/${cartItemId}`,
    method: 'put',
    data: { quantity },
  })
}

// 删除购物车商品 (单条)
export const deleteCartItem = (cartItemId) => {
  return request({
    url: `/cart/items/${cartItemId}`,
    method: 'delete',
  })
}

// 批量删除购物车商品
export const deleteCartItemsBatch = (ids) => {
  // ids: ["1", "2"]
  return request({
    url: '/cart/items',
    method: 'delete',
    data: { ids }, // 对应后端 @RequestBody
  })
}
