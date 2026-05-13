import request from '@/utils/request'

// AI 发酵数据智能分析
export function analyzeFermentation(data) {
  return request({
    url: '/api/v1/ai/fermentation-prediction',
    method: 'post',
    data
  })
}

// AI 行车告警智能诊断
export function diagnoseCraneAlarm(data) {
  return request({
    url: '/api/v1/ai/alarm-diagnosis',
    method: 'post',
    data
  })
}

// AI 大物体识别
export function detectLargeObject(data) {
  return request({
    url: '/api/v1/ai/object-detection',
    method: 'post',
    data
  })
}

// AI 调度任务优化建议
export function optimizeSchedule(data) {
  return request({
    url: '/api/v1/ai/schedule-optimization',
    method: 'post',
    data
  })
}

// AI 垃圾吊调度方案生成
export function generateCraneDispatch(data) {
  return request({
    url: '/api/v1/ai/crane-dispatch',
    method: 'post',
    data
  })
}

// AI 垃圾吊调度方案确认/模拟下发
export function confirmCraneDispatch(data) {
  return request({
    url: '/api/v1/ai/crane-dispatch/confirm',
    method: 'post',
    data
  })
}

// AI 服务状态
export function getAiStatus() {
  return request({
    url: '/api/v1/ai/status',
    method: 'get'
  })
}
