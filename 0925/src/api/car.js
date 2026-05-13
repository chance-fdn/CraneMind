import request from '@/utils/request'

// 获取车辆卸料列表
export function findCarDisList(data) {
  return request({
    url: '/car/findCarDisList',
    method: 'post',
    data
  })
}

// 获取车辆进出列表
export function findCarInOutList(data) {
  return request({
    url: '/car/findCarInOutList',
    method: 'post',
    data
  })
}

// 获取车辆运料列表
export function findCarInfoList(data) {
  return request({
    url: '/car/findCarInfoList',
    method: 'post',
    data
  })
}

// 手动添加车辆运料记录
export function addCarInfo(data) {
  return request({
    url: '/car/addCarInfo',
    method: 'post',
    data
  })
}

// 获取在场车辆数
export function findCarCount(data) {
  return request({
    url: '/car/findCarCount',
    method: 'post',
    data
  })
}

// 获取卸料门的车辆排队信息
export function findDoorQueue(data) {
  return request({
    url: '/car/findDoorQueue',
    method: 'post',
    data
  })
}
