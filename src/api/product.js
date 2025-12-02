import request from './request'

// 获取分类树
export const getCategoryTree = () => {
  return request({
    url: '/categories/tree',
    method: 'get',
  })
}

// 分页查询商品列表
// params: { pageNum, pageSize, categoryId, keyword, sortField, sortOrder }
export const getProductList = (params) => {
  return request({
    url: '/products',
    method: 'get',
    params,
  })
}

// 获取商品详情
export const getProductDetail = (id) => {
  return request({
    url: `/products/${id}`,
    method: 'get',
  })
}
