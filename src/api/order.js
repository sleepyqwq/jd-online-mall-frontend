import request from './request'

// 创建订单
export const createOrder = (data) => {
  // data: { sourceType: 'CART'|'BUY_NOW', cartItemIds: [], addressId, remark ... }
  return request({
    url: '/orders',
    method: 'post',
    data,
  })
}

// 订单列表
export const getOrderList = (params) => {
  // params: { status, pageNum, pageSize }
  return request({
    url: '/orders',
    method: 'get',
    params,
  })
}

// 订单详情
export const getOrderDetail = (orderId) => {
  return request({
    url: `/orders/${orderId}`,
    method: 'get',
  })
}

// 取消订单
export const cancelOrder = (orderId, reason) => {
  return request({
    url: `/orders/${orderId}/cancel`,
    method: 'put',
    data: { reason },
  })
}

// 模拟支付
export const payOrder = (orderId) => {
  return request({
    url: `/orders/${orderId}/pay`,
    method: 'post',
  })
}
