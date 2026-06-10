import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/api/v1/auth/login',
    method: 'post',
    data
  })
}

export function logout(data) {
  return request({
    url: '/user/exit',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/user/registration',
    method: 'post',
    data
  })
}

export function update(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data
  })
}

export function uploadPhoto(data) {
  return request({
    url: '/user/uploadPhoto',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}

// 用户信息查询
export function findUserList(data) {
  return request({
    url: '/user/find',
    method: 'post',
    data
  })
}

// 账号升/降权(账号升为管理员/降为普通用户)
export function userPromotion(data) {
  const { userIdentity, userName } = data
  return request({
    url: `/user/promotion`,
    method: 'post',
    data: `identity=${userIdentity}&userName=${userName}`
  })
}

// 账号冻结/解冻
export function blockUser(data) {
  const { status, userName } = data
  return request({
    url: `/user/blockUser`,
    method: 'post',
    data: `status=${status}&userName=${userName}`
  })
}

// 用户信息查询
export function findLogs(data) {
  return request({
    url: '/user/findLogs',
    method: 'post',
    data
  })
}
