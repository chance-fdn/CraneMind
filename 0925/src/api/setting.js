import request from '@/utils/request'

// 获取配置参数
export function findParamSet(data) {
  return request({
    url: '/disParamSet/findParamSet',
    method: 'post',
    data
  })
}

// 设置参数
export function paramSet(data) {
  return request({
    url: '/disParamSet/paramSet',
    method: 'post',
    data
  })
}
