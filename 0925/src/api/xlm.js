import request from '@/utils/request'

// 确认卸料门关门
export function ackClose(data) {
  const { id, status } = data
  return request({
    url: '/xlm/ackClose',
    method: 'post',
    data: `id=${id}&status=${status}`
  })
}

// 查询卸料门关门记录
export function findCloseMsg(data) {
  return request({
    url: '/xlm/findCloseMsg',
    method: 'post',
    data
  })
}

// 获取卸料门自动状态(0:关闭;1：开启)
export function getAutomaticStatus(data) {
  return request({
    url: '/xlm/getAutomaticStatus',
    method: 'post',
    data
  })
}

// 开启卸料门自动(0:关闭;1：开启)
export function openAutomatic(data) {
  const { status } = data
  return request({
    url: '/xlm/openAutomatic',
    method: 'post',
    data: `status=${status}`
  })
}

// 获取卸料门前摄像头视频
export function getDoorCameraUrl(data) {
  return request({
    url: '/xlm/getDoorCameraUrl',
    method: 'post',
    data
  })
}
