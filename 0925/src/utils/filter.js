// 垃圾吊任务类型
export function filterDisCraneTaskType(key) {
  let val = ''
  switch (key) {
    case 'TL':
      val = '投料'
      break
    case 'DL':
      val = '堆料'
      break
    case 'LS':
      val = '沥水'
      break
    case 'JG':
      val = '揭盖'
      break
    case 'QD':
      val = '清底'
      break
    case 'WG':
      val = '挖沟'
      break
    case 'BR':
      val = '避让'
      break
    case 'ZL':
      val = '转料'
      break
    default:
      val = key
      break
  }
  return val
}

// 垃圾吊执行类型
export function filterDisCraneExecutionType(key) {
  let val = ''
  switch (key) {
    case 'ZL':
      val = '抓料'
      break
    case 'FL':
      val = '放料'
      break
    case 'SL':
      val = '撒料'
      break
    case 'YD':
      val = '移动'
      break
    default:
      val = key
      break
  }
  return val
}

// 垃圾吊任务状态
export function filterDisCraneTaskStatus(key) {
  let val = ''
  switch (key) {
    case '0':
      val = '未下发'
      break
    case '1':
      val = '正在下发'
      break
    case '2':
      val = '已下发'
      break
    case '3':
      val = '进行中'
      break
    case '4':
      val = '已完成'
      break
    case '5':
      val = '已取消'
      break
    default:
      val = key
      break
  }
  return val
}

// 大物告警记录状态
export function largeObjectStatus(key) {
  let val = ''
  switch (key) {
    case '0':
      val = '未确认'
      break
    case '2':
      val = '是大物'
      break
    case '1':
      val = '非大物'
      break
    case '3':
      val = '已处理'
      break
    default:
      val = key
      break
  }
  return val
}

// 设备类型
export function filterDeviceType(key) {
  // TG:抬杆； XLM：卸料门；HC：行车
  let val = ''
  switch (key) {
    case 'TG':
      val = '抬杆'
      break
    case 'XLM':
      val = '卸料门'
      break
    case 'HC':
      val = '行车'
      break
    case 'ZD':
      val = '爪吊'
      break
    case 'SXT':
      val = '摄像头'
      break
    case 'LED':
      val = 'LED灯'
      break
    case 'DJ':
      val = '电机设备'
      break
    case 'LD':
      val = '雷达设备'
      break
    case 'YYBB':
      val = '语音播报设备'
      break
    default:
      val = key
      break
  }
  return val
}

// 垃圾池分区
export function filterDisArea(key) {
  let str = ''
  switch (key) {
    case 'FJ':
      str = '发酵区'
      break
    case 'TL':
      str = '投料区'
      break
    case 'JG':
      str = '间隔区'
      break
    case 'DL':
      str = '堆料区'
      break
    default:
      str = key
      break
  }
  return str
}

