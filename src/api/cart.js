import request from './request'

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
