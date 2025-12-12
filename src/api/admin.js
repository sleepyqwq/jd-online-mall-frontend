import request from './request'

// 管理员登录
// 三、1.(1) 管理员登录
export const adminLogin = (data) => {
  return request({
    url: '/admin/auth/login',
    method: 'post',
    data,
  })
}

// 获取管理员信息
// 三、1.(2) 获取当前管理员信息
export const getAdminInfo = () => {
  return request({
    url: '/admin/auth/me',
    method: 'get',
  })
}

// 管理员退出
// 三、1.(3) 管理员退出
export const adminLogout = () => {
  return request({
    url: '/admin/auth/logout',
    method: 'post',
  })
}

// ================== 商品管理 ==================
// 三、2.(1) 后台查询商品列表
export const getAdminProductList = (params) => {
  return request({
    url: '/admin/products',
    method: 'get',
    params,
  })
}

// 三、2.(2) 新增商品
export const createAdminProduct = (data) => {
  return request({
    url: '/admin/products',
    method: 'post',
    data,
  })
}

// 三、2.(3) 编辑商品
export const updateAdminProduct = (id, data) => {
  return request({
    url: `/admin/products/${id}`,
    method: 'put',
    data,
  })
}

// 三、2.(4) 删除商品
export const deleteAdminProduct = (id) => {
  return request({
    url: `/admin/products/${id}`,
    method: 'delete',
  })
}

// 三、2.(5) 上架/下架商品
export const updateAdminProductStatus = (id, status) => {
  return request({
    url: `/admin/products/${id}/status`,
    method: 'put',
    data: { status },
  })
}

// ================== 分类管理 ==================
// 三、3.(1) 查询分类列表（树）
export const getAdminCategoryTree = () => {
  return request({
    url: '/admin/categories',
    method: 'get',
  })
}

// 三、3.(2) 新增分类
export const createAdminCategory = (data) => {
  return request({
    url: '/admin/categories',
    method: 'post',
    data,
  })
}

// 三、3.(3) 编辑分类
export const updateAdminCategory = (id, data) => {
  return request({
    url: `/admin/categories/${id}`,
    method: 'put',
    data,
  })
}

// 三、3.(4) 删除分类
export const deleteAdminCategory = (id) => {
  return request({
    url: `/admin/categories/${id}`,
    method: 'delete',
  })
}

// ================== 订单管理 ==================
// 三、4.(1) 后台订单列表
export const getAdminOrderList = (params) => {
  return request({
    url: '/admin/orders',
    method: 'get',
    params,
  })
}

// 三、4.(2) 后台订单详情
export const getAdminOrderDetail = (orderId) => {
  return request({
    url: `/admin/orders/${orderId}`,
    method: 'get',
  })
}

// 三、4.(3) 修改订单状态
export const updateAdminOrderStatus = (orderId, status, remark) => {
  return request({
    url: `/admin/orders/${orderId}/status`,
    method: 'put',
    data: { status, remark },
  })
}
