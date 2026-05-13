/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  // const valid_map = ['admin', 'editor']
  // return valid_map.indexOf(str.trim()) >= 0
  return true
}

/**
 * 匹配场景 - 设置
 */
export function filterGroup(str) {
  let val = ''
  // 获取英文
  const word = str.match(/[a-zA-Z]/g)?.join('')
  // 获取数字
  const num = str.match(/\d/g)?.join('')
  switch (word) {
    case 'ljc':
      val = '垃圾场'
      break
    case 'xlm':
      val = '卸料门'
      break
    case 'tlk':
      val = '投料口'
      break
    case 'ljd':
      val = '垃圾吊'
      break
    case 'fsl':
      val = '焚烧炉'
      break
    case 'dt':
      val = '大厅'
      break
    case 'ljk':
      val = '垃圾坑'
      break
    case 'ms':
      val = '模式单独'
      break
    case 'zd':
      val = '抓斗开闭时间'
      break
    case 'wg':
      val = '挖沟区域'
      break
    default:
      val = word
      break
  }
  return val + (num || '')
}

