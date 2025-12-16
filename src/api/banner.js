import request from './request'

// 获取首页轮播图
export const getHomeBannerList = () => {
  return request({
    url: '/banners',
    method: 'get',
  })
}
