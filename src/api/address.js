import request from './request'

export const getAddressList = () => {
  return request({
    url: '/addresses',
    method: 'get',
  })
}

export const addAddress = (data) => {
  return request({
    url: '/addresses',
    method: 'post',
    data,
  })
}

export const updateAddress = (id, data) => {
  return request({
    url: `/addresses/${id}`,
    method: 'put',
    data,
  })
}

export const deleteAddress = (id) => {
  return request({
    url: `/addresses/${id}`,
    method: 'delete',
  })
}

export const setDefaultAddress = (id) => {
  return request({
    url: `/addresses/${id}/default`,
    method: 'put',
  })
}
