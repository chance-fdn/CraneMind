// import Cookies from 'js-cookie'

const TOKEN_NAME = 'garbage-pit-token'
const USE_INFO_NAME = 'garbage-pit-userInfo'

// 获取token
export function getToken() {
  return sessionStorage.getItem(TOKEN_NAME)
}
// 存token
export function setToken(token) {
  sessionStorage.setItem(TOKEN_NAME, token)
}

// 获取user_info
export function getUserInfo() {
  return JSON.parse(sessionStorage.getItem(USE_INFO_NAME))
}
// 存userInfo
export function setUserInfo(obj) {
  sessionStorage.setItem(USE_INFO_NAME, JSON.stringify(obj))
}

// 删除token
export function removeToken() {
  return sessionStorage.removeItem(TOKEN_NAME)
}
// 删除用户
export function removeUserInfo() {
  return sessionStorage.removeItem(USE_INFO_NAME)
}
// 全部删除
export function clearAll() {
  removeToken()
  removeUserInfo()
}
