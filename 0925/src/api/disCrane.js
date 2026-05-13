import request from '@/utils/request'

// 垃圾吊任务统计
export function countTask(data) {
  const { starTime, endTime, craneNo } = data //
  return request({
    url: `/disCrane/countTask?endTime=${endTime}&starTime=${starTime}&craneNo=${craneNo || ''}`,
    method: 'post'
    // headers: {
    //   'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    // },
    // data
  })
}

// 获取大物告警记录
export function findLargeObjectList(data) {
  return request({
    url: '/disCrane/findLargeObjectList',
    method: 'post',
    data
  })
}
// 大物告警处理
export function ackAlarm(data) {
  const { id, status } = data
  return request({
    url: `/disCrane/ackAlarm`,
    method: 'post',
    data: `id=${id}&status=${status}`
  })
}

// 获取垃圾吊投料记录
export function findPutMaterialList(data) {
  return request({
    url: '/disCrane/findPutMaterialList',
    method: 'post',
    data
  })
}

// 获取垃圾吊任务列表
export function findTaskList(data) {
  return request({
    url: '/disCrane/findTaskList',
    method: 'post',
    data
  })
}

// 行车实时位置信息
export function readDriveData(data) {
  return request({
    url: '/disCrane/readDriveData',
    method: 'post',
    data
  })
}

// 垃圾吊实时位置信息
export function readPawlData(data) {
  return request({
    url: '/disCrane/readPawlData',
    method: 'post',
    data
  })
}

// 告警行车位置校验
export function ackCranePlace(data) {
  return request({
    url: '/disCrane/ackCranePlace',
    method: 'post',
    data: `id=${data.id}`
  })
}

// 行车告警处理
export function handleCraneAlarm(data) {
  return request({
    url: '/disCrane/handleCraneAlarm',
    method: 'post',
    data: `id=${data.id}`
  })
}

// 获取行车告警记录列表
export function findCraneAlarmList(data) {
  return request({
    url: '/disCrane/findCraneAlarmList',
    method: 'post',
    data
  })
}

// 投料口投料状态
export function tlState(data) {
  return request({
    url: '/disCrane/tlState',
    method: 'post',
    data
  })
}

// 行车职责配置信息查询
export function findCraneDutyConfig(data) {
  return request({
    url: '/disCrane/findCraneDutyConfig',
    method: 'post',
    data
  })
}

// 行车职责配置
export function craneDutyConfig(data) {
  return request({
    url: '/disCrane/craneDutyConfig',
    method: 'post',
    data
  })
}

// 删除行车职责配置
export function delCraneDutyConfig(data) {
  return request({
    url: '/disCrane/delCraneDutyConfig',
    method: 'post',
    data: `id=${data}`
  })
}

// 垃圾吊任务时间统计
export function countTaskTime(data) {
  const { time, craneNo } = data
  return request({
    url: '/disCrane/countTaskTime',
    method: 'post',
    data: `time=${time}&craneNo=${craneNo}`
  })
}

// 行车职责简略配置信息查询
export function findBriefCraneDuty(data) {
  return request({
    url: '/disCrane/findBriefCraneDuty',
    method: 'post',
    data
  })
}

// 行车职责简略配置信息删除
export function delBriefCraneDuty(data) {
  const { craneNo, dutyNo, dutyType } = data
  return request({
    url: '/disCrane/delBriefCraneDuty',
    method: 'post',
    data: `craneNo=${craneNo}&dutyNo=${dutyNo}&dutyType=${dutyType}`
  })
}

// 行车堆料职责配置卸料门
export function updateCraneDutyDoor(data) {
  const { craneNo, dutyNo, doors } = data
  return request({
    url: '/disCrane/updateCraneDutyDoor',
    method: 'post',
    data: `craneNo=${craneNo}&dutyNo=${dutyNo}&doors=${doors}`
  })
}

// 行车任务计算日志查询
export function findTaskLog(data) {
  return request({
    url: '/disCrane/findTaskLog',
    method: 'post',
    data
  })
}

// AI 垃圾吊调度方案生成
export function aiDispatch(data) {
  return request({
    url: '/disCrane/aiDispatch',
    method: 'post',
    data
  })
}

// AI 垃圾吊调度方案确认/模拟下发
export function confirmAiDispatch(data) {
  return request({
    url: '/disCrane/confirmAiDispatch',
    method: 'post',
    data
  })
}
