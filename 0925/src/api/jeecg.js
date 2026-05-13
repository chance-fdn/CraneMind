import request from '@/utils/request'
const SERVICEIP = process.env.VUE_APP_OTHER_SERVER_IP

// 医废模式开启-分页列表查询
export function disMedicalList(params) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_medical_model/disMedicalModel/list',
    method: 'get',
    params
  })
}

// 开启指定时间的医废模式
export function openSpecifiedTimeMedical(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_medical_model/disMedicalModel/openSpecifiedTimeMedical',
    method: 'post',
    data
  })
}

// 关闭指定时间的医废模式
export function closeSpecifiedTimeMedical(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_medical_model/disMedicalModel/closeSpecifiedTimeMedical',
    method: 'post',
    data
  })
}

// 查询残渣模式状态
export function getResidueStatus(params) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_residue_model/disResidueModel/getResidueStatus',
    method: 'get',
    params
  })
}

// 手动开启残渣模式
export function openResidueModel(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_residue_model/disResidueModel/openResidueModel',
    method: 'post',
    data
  })
}

// 手动关闭残渣模式
export function closeResidueModel(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_residue_model/disResidueModel/closeResidueModel',
    method: 'post',
    data
  })
}

// 人工模式
export function artificialModel(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/artificialModel',
    method: 'post',
    data
  })
}

// 自动模式
export function autoModel(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/autoModel',
    method: 'post',
    data
  })
}

// 急停模式
export function emergencyStop(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/emergencyStop',
    method: 'post',
    data
  })
}

// 正常停止
export function normalStop(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/normalStop',
    method: 'post',
    data
  })
}

// 查询操作模式状态
export function getOperationStatus(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/getOperationStatus',
    method: 'post',
    data
  })
}

// 复位
export function reset(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/reset',
    method: 'post',
    data
  })
}

// 开启   行车信息-停用或启用行车
export function startOrStopCrane(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_crane_info/disCraneInfo/startOrStopCrane',
    method: 'post',
    data
  })
}

// 查询所有行车的状态   人工、自动
export function selectAllCraneStatus(params) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/selectAllCraneStatus',
    method: 'get',
    params
  })
}

// 设置单个行车的状态   人工、自动
export function updateCraneStatus(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/updateCraneStatus',
    method: 'post',
    data
  })
}

// 查询所有行车的状态   启动、停止
export function selectAllCranePauseStatus(params) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/selectAllCranePauseStatus',
    method: 'get',
    params
  })
}

// 启动单台行车
export function restoreSingleCrane(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/restoreSingleCrane',
    method: 'post',
    data
  })
}

// 停止单台行车
export function emergencyStopSingleCrane(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/emergencyStopSingleCrane',
    method: 'post',
    data
  })
}

// 区域状态切换
export function areaStatusToggle(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/areaStatusToggle',
    method: 'post',
    data
  })
}

// 切换投料区
export function toggleTlArea(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/toggleTlArea',
    method: 'post',
    data
  })
}

// 取消单台行车任务接口
export function cancelTaskByCraneNo(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-plc/plc/operation/cancelTaskByCraneNo',
    method: 'post',
    data
  })
}

// 区域信息-关闭区域揭盖
export function closeJg(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/closeJg',
    // headers: {
    //   'Content-Type': 'application/json'
    // },
    method: 'post',
    data
  })
}

// 区域信息-开启区域揭盖
export function openJg(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/openJg',
    // headers: {
    //   'Content-Type': 'application/json'
    // },
    method: 'post',
    data
  })
}

// 区域信息-区域状态指定修改
export function updateAreaStatus(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/updateAreaStatus',
    method: 'post',
    data
  })
}

// 区域信息-开启投料区转料
export function openZl(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/openZl',
    method: 'post',
    data
  })
}

// 区域信息-关闭投料区转料
export function closeZl(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/closeZl',
    method: 'post',
    data
  })
}

// 区域信息-开启区域沥水
export function openLs(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/openLs',
    method: 'post',
    data
  })
}

// 区域信息-关闭区域沥水
export function closeLs(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/closeLs',
    method: 'post',
    data
  })
}

// 区域信息-开启区域清底
export function openQd(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/openQd',
    method: 'post',
    data
  })
}

// 区域信息-关闭区域清底
export function closeQd(data) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_area_info/disAreaInfo/closeQd',
    method: 'post',
    data
  })
}

// 三维点云数据
export function getPointCloud(params) {
  return request({
    baseURL: SERVICEIP + '/jeecg-dispatch/dis_point_cloud/disPointCloud/getPointCloud',
    method: 'get',
    params
  })
}

// // 车辆列表 pageNo pageSize
// export function cgCarInfoList(params) {
//   return request({
//     baseURL: SERVICEIP + '/jeecg-car-guidance/cg_car_info/cgCarInfo/list',
//     method: 'get',
//     params
//   })
// }

// // 车辆列表 - 添加
// export function cgCarInfoAdd(data) {
//   return request({
//     baseURL: SERVICEIP + '/jeecg-car-guidance/cg_car_info/cgCarInfo/add',
//     method: 'post',
//     data
//   })
// }

// // 车辆列表 - 编辑
// export function cgCarInfoEdit(data) {
//   return request({
//     baseURL: SERVICEIP + '/jeecg-car-guidance/cg_car_info/cgCarInfo/edit',
//     method: 'post',
//     data
//   })
// }

// // 车辆列表 - 删除
// export function cgCarInfoDelete(params) {
//   return request({
//     baseURL: SERVICEIP + '/jeecg-car-guidance/cg_car_info/cgCarInfo/delete',
//     method: 'get',
//     params
//   })
// }
