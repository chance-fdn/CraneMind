import request from '@/utils/request'

// 获取调度指令列表
export function findInstructionList(data) {
  return request({
    url: '/plc/findInstructionList',
    method: 'post',
    data
  })
}

// 获取调度任务列表
export function findPlcStepNodeList(data) {
  return request({
    url: '/plc/findPlcStepNodeList',
    method: 'post',
    data
  })
}
