import request from '@/utils/request'

// 获取垃圾池各区发酵数据
export function disAreaInfo(data) {
  return request({
    url: '/disAreaInfo/findList',
    method: 'post',
    data
  })
}

// 获取垃圾池投料口信息
export function findPutMaterialPortList(data) {
  return request({
    url: '/disAreaInfo/findPutMaterialPortList',
    method: 'post',
    data
  })
}

// 获取垃圾池各区垃圾量数据
export function findPartTrash(data) {
  return request({
    url: '/disAreaInfo/findPartTrash',
    method: 'post',
    data
  })
}

// 获取垃圾池垃圾总量数据
export function findTrashSum(data) {
  return request({
    url: '/disAreaInfo/findTrashSum',
    method: 'post',
    data
  })
}

// 获取当前堆料区开门信息
export function findDlPortList(data) {
  return request({
    url: '/disAreaInfo/findDlPortList',
    method: 'post',
    data
  })
}

// 添加堆料区的卸料门
export function addDlPort(data) {
  const { areaNo, doorNo } = data
  return request({
    url: '/disAreaInfo/addDlPort',
    method: 'post',
    data: `areaNo=${areaNo}&doorNo=${doorNo}`
  })
}

// 删除堆料区的卸料门
export function delDlPort(data) {
  const { id } = data
  return request({
    url: '/disAreaInfo/delDlPort',
    method: 'post',
    data: `id=${id}`
  })
}

// 更新区域信息
export function updateArea(data) {
  return request({
    url: '/disAreaInfo/updateArea',
    method: 'post',
    data
  })
}
