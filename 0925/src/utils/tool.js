import XLSX from 'xlsx'
const Base64 = require('js-base64').Base64

export function dataURLtoFile(dataurl, filename = 'file') {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const suffix = mime.split('/')[1]
  // const bstr = atob(arr[1])
  const bstr = Base64.decode(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], `${filename}.${suffix}`, {
    type: mime
  })
}

export function getIPs(callback) {
  var ip_dups = {}
  var RTCPeerConnection = window.RTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.webkitRTCPeerConnection
  // var useWebKit = !!window.webkitRTCPeerConnection
  var mediaConstraints = {
    optional: [{ RtpDataChannels: true }]
  }
  // 这里就是需要的ICEServer了
  var servers = {
    iceServers: [
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
  var pc = new RTCPeerConnection(servers, mediaConstraints)
  function handleCandidate(candidate) {
    var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
    var hasIp = ip_regex.exec(candidate)
    if (hasIp) {
      var ip_addr = ip_regex.exec(candidate)[1]
      if (ip_dups[ip_addr] === undefined) { callback(ip_addr) }
      ip_dups[ip_addr] = true
    }
  }
  // 网络协商的过程
  pc.onicecandidate = function(ice) {
    if (ice.candidate) {
      handleCandidate(ice.candidate.candidate)
    }
  }
  pc.createDataChannel('')
  // 创建一个SDP(session description protocol)会话描述协议 是一个纯文本信息 包含了媒体和网络协商的信息
  pc.createOffer(function(result) {
    pc.setLocalDescription(result, function() {}, function() {})
  }, function() {})
  setTimeout(function() {
    var lines = pc.localDescription.sdp.split('\n')
    lines.forEach(function(line) {
      if (line.indexOf('a=candidate:') === 0) { handleCandidate(line) }
    })
  }, 1000)
}

export function exportTableToExcel(ref) {
  const table = this.$refs[ref].$children[0].$el // 获取 el-table 对应的 DOM 元素
  const workbook = XLSX.utils.table_to_book(table)
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const fileName = this.$route.meta.title + '.xlsx'

  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
