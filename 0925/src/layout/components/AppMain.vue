<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <router-view :key="key" />
    </transition>
    <!-- <div style="position: fixed; top: 0;" @click="openLargeObject">点击</div> -->
    <el-dialog
      title="发现大物"
      :visible.sync="dialogVisible"
      width="30%"
      top="30vh"
      class="warn-dialog"
      :modal="false"
    >
      <div class="warn-cont">
        <img class="warn-img" src="~@/assets/warning.png" alt="">
        <div class="warn-desc">
          <div class="show-img">
            <span>查看大图</span>
            <el-image
              class="img-list"
              :src="require('@/assets/view.png')"
              :preview-src-list="[BASE_URL + largeInfo.capturePhoto]"
            />
          </div>
          <div>发现大物，请确认！</div>
          <!-- <div v-else>需要把行车移动至({{ largeInfo.positionX+ ', ' +largeInfo.positionY }})处</div> -->
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleAckAlarm('1')">确定不是大物</el-button>
        <el-button type="primary" @click="handleAckAlarm('2')">确定是大物</el-button>
        <!-- <el-button v-if="largeInfo.type === 'craneAlarm'" type="primary" @click="openCraneAlarm(largeInfo.id)">确定</el-button> -->
      </span>
    </el-dialog>

    <el-dialog
      :title="'卸料门' + filterXlmType"
      :visible.sync="xlmVisible"
      width="20%"
      top="30vh"
      :modal="false"
      :destroy-on-close="true"
      :before-close="handleXlmDiadogClose"
    >
      <span v-if="xlmInfo.doorNo" style="font-size: 20px;">是否{{ filterXlmType }}
        <span style="color: red;">{{ ' ' + xlmInfo.doorNo.slice(4) + ' ' }}</span>
        号卸料门!</span>
      <span slot="footer" class="dialog-footer">
        <!-- <el-button @click="handleXlmClose(2)">忽略</el-button> -->
        <el-button type="primary" @click="handleXlmClose">确定</el-button>
      </span>
    </el-dialog>

  </section>
</template>

<script>
import { ackAlarm } from '@/api/disCrane'
import { ackClose } from '@/api/xlm'

export default {
  name: 'AppMain',
  data() {
    return {
      // BASE_URL: process.env.VUE_APP_PHOTO_API + 'other/',
      BASE_URL: 'data:image/jpeg;base64,',
      websock: null,
      lockReconnect: false, // 是否真正建立连接
      timeoutnum: null, // 断开 重连倒计时
      dialogVisible: false,
      largeInfo: {},
      craneAlarmInfo: {},
      craneData: [],
      craneList: [],
      doorData: [],
      xlmVisible: false,
      xlmInfo: {},
      xlmGarbageTest: [
        {
          key: '01',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '02',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '03',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '04',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '05',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '06',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '07',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '08',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '09',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '10',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '11',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '12',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '13',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '14',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '15',
          value: '',
          avg: '',
          max: ''
        },
        {
          key: '16',
          value: '',
          avg: '',
          max: ''
        }
      ],
      isOpenLarge: false,
      taskLogInfo: {}
    }
  },
  provide() {
    return {
      parent: this
      // preCraneData: () => this.craneData
    }
  },
  computed: {
    key() {
      return this.$route.path
    },
    filterXlmType() {
      let str = ''
      switch (this.xlmInfo.category) {
        case 0:
          str = '关闭'
          break
        case 1:
          str = '开启'
          break
        default:
          break
      }
      return str
    }
  },
  created() {
    this.initWebSocket()
  },
  destroyed() {
    this.websock.close() // 离开路由之后断开websocket连接
  },
  methods: {
    initWebSocket() {
      // 初始化weosocket
      const wsuri = `ws://${process.env.VUE_APP_SERVER_IP}/websocket`
      this.websock = new WebSocket(wsuri)
      // 客户端接收服务端数据时触发
      this.websock.onmessage = this.websocketonmessage
      // 连接建立时触发
      this.websock.onopen = this.websocketonopen
      // 通信发生错误时触发
      this.websock.onerror = this.websocketonerror
      // 连接关闭时触发
      this.websock.onclose = this.websocketclose
    },
    websocketonmessage(e) {
      // setInterval(() => {
      // console.log('接收数据', JSON.parse(e.data))
      // }, 10000)
      const data = JSON.parse(e.data)
      switch (data.type) {
        case 'craneAlarm':
          this.craneAlarmInfo = data
          break
        case 'objectAlarm':
          this.openLargeObject(data)
          break
        case 'timelyData':
          this.craneData = data.data
          if (this.craneList.length >= 3000) {
            this.craneList.length = 0
          }
          this.craneList.push(...data.data)
          this.doorData = data.xlmStatus
          this.xlmGarbageTest.map((el) => {
            el.max = data.xlmMaxHeight?.find((ele) => ele.key.includes(el.key))?.value || '-'
            el.avg = data.xlmAvgHeight?.find((ele) => ele.key.includes(el.key))?.value || '-'
          })
          break
        case 'closeXlm':
          this.xlmInfo = data
          this.xlmVisible = true
          break
        case 'taskLog':
          this.taskLogInfo = data.data
          break
        default:
          break
      }
    },
    websocketonopen() {
      console.log('open', this.websock.readyState)
      if (this.websock.readyState === 1) {
        this.lockReconnect = true
      } else {
        this.reconnect()
      }
    },
    websocketonerror() {
      console.log('websock出现错误')
      this.reconnect()
    },
    websocketclose() {

    },
    reconnect() {
      // 重新连接
      var that = this
      if (that.lockReconnect) {
        return
      }
      that.lockReconnect = true
      // 没连接上会一直重连，设置延迟避免请求过多
      that.timeoutnum && clearTimeout(that.timeoutnum)
      that.timeoutnum = setTimeout(function() {
        // 新连接
        that.initWebSocket()
        that.lockReconnect = false
      }, 5000)
    },
    openLargeObject(data) {
      if (this.isOpenLarge) {
        this.largeInfo = data
        this.dialogVisible = true
      }
    },
    handleChangeLargeStatus() {
      this.isOpenLarge = !this.isOpenLarge
    },
    async handleAckAlarm(key) {
      if (!this.largeInfo?.id) return

      const { success } = await ackAlarm({
        id: this.largeInfo.id,
        status: key
      })
      success && this.$message({
        message: '指令已下发！大物处理后，请在 记录查询-垃圾吊记录-大物告警记录 里确定大物已处理',
        type: 'success',
        duration: 5000
      })
      this.dialogVisible = false
    },
    async handleXlmClose() {
      const { success } = await ackClose({
        id: this.xlmInfo.id,
        status: 1
      })
      success && this.$message({
        message: '操作成功!',
        type: 'success'
      })
      this.xlmVisible = false
    },
    handleXlmDiadogClose(done) {
      this.$confirm('确认' + this.filterXlmType + '卸料门')
        .then(_ => {
          ackClose({
            id: this.xlmInfo.id,
            status: 1
          }).then(({ success }) => {
            success && this.$message({
              message: '操作成功!',
              type: 'success'
            })
            done()
          })
        })
        .catch(_ => {})
    }
  }
}
</script>

<style scoped>
.app-main {
  /*50 = navbar  */
  height: calc(100% - 50px);
  width: 100%;
  position: relative;
  overflow: hidden;
}
.fixed-header+.app-main {
  padding-top: 50px;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
<style lang="scss" scoped>
.warn-dialog {
  ::v-deep .el-dialog {
    border: 5px solid red;
    .el-image-viewer__close,.el-image-viewer__canvas {
      color: #fff;
    }
  }
  .warn-cont {
    display: flex;
    align-items: center;
    justify-content: center;
    .warn-img {
      width: 50px;
      height: 50px;
    }
    .warn-desc {
      margin-left: 10px;
      font-weight: 700;
      .show-img {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 5px;
        .img-list {
          width: 24px;
          height: 24px;
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
