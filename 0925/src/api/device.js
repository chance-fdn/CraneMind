import request from '@/utils/request'

// 获取设备告警信息
export function findDeviceFaultList(data) {
  return request({
    url: '/device/findDeviceFaultList',
    method: 'post',
    data
  })
}

// 获取设备列表
export function findDeviceList(data) {
  return request({
    url: '/device/findDeviceList',
    method: 'post',
    data
  })
}

// 获取设备运行数据列表
export function findDeviceDataList(data) {
  return request({
    url: '/device/findDeviceDataList',
    method: 'post',
    data
  })
}

// 获取抬杆设备状态
export function getTgState(data) {
  return request({
    url: '/device/getTgState',
    method: 'post',
    data
  })
}

// 统计行车设备每天运行数据(平均数)
export function statisticsDeviceData(data) {
  return request({
    url: '/device/statisticsDeviceData',
    method: 'post',
    data
  })
}

// 获取大厅所有摄像头视频信息
export function findDtCameraVideo(data) {
  return request({
    url: '/device/findDtCameraVideo',
    method: 'post',
    data
  })
}
