<template>
  <div class="sala-main">
    <div class="sala-top">
      垃圾接收大厅
    </div>
    <div class="reload">
      <el-button type="primary" @click="$router.go(0)">重新加载</el-button>
    </div>
    <div class="sala-container">
      <div class="sala-left box" @click="handleVideoClick(salaCameraUrl, '全视图')">
        <video-test v-if="salaCameraUrl" :rtsp="salaCameraUrl" />
      </div>
      <div class="sala-right box">
        <div class="door-list">
          <div v-for="item in doorList" :key="item.name" class="door-item">
            <div :class="['item-video', {'has-video' : item.info.doorCameraUrl}]" @click="handleVideoClick(item.info.doorCameraUrl, item.name)">
              <video-test v-if="item.info.doorCameraUrl && item.info.license" :rtsp="item.info.doorCameraUrl" />
              <img v-else src="@/assets/watch.webp" alt="">
            </div>
            <div :class="['title', {'normal' : item.info.doorCameraUrl}]">{{ item.name }}</div>
            <div class="info">
              <div class="info-title">正在卸料：</div>
              <div class="text current">{{ filterLicense(item.info.license, 'current') }}</div>
            </div>
            <div class="info">
              <div class="info-title">等待卸料：</div>
              <el-tooltip class="item" effect="dark" :content="filterLicense(item.info.license, 'wait')" placement="bottom">
                <div class="text wait">{{ filterLicense(item.info.license, 'wait') }}</div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      :title="'垃圾接收大厅摄像头 - ' + currentTitle"
      :visible.sync="visible"
      width="70%"
      :modal="false"
      :destroy-on-close="true"
      @close="handleDialogClose"
    >
      <video-test v-if="currentRtsp" :rtsp="currentRtsp" />
    </el-dialog>
  </div>
</template>

<script>
import videoTest from './component/jsmpegVideo.vue'
import { findDoorQueue } from '@/api/car'
import { findDtCameraVideo } from '@/api/device'

export default {
  components: { videoTest },
  data() {
    return {
      salaCameraUrl: '',
      doorList: [
        {
          name: '01',
          info: { license: '' }
        },
        {
          name: '02',
          info: { license: '' }
        },
        {
          name: '03',
          info: { license: '' }
        },
        {
          name: '04',
          info: { license: '' }
        },
        {
          name: '05',
          info: { license: '' }
        },
        {
          name: '06',
          info: { license: '' }
        },
        {
          name: '07',
          info: { license: '' }
        },
        {
          name: '08',
          info: { license: '' }
        },
        {
          name: '09',
          info: { license: '' }
        },
        {
          name: '10',
          info: { license: '' }
        },
        {
          name: '11',
          info: { license: '' }
        },
        {
          name: '12',
          info: { license: '' }
        },
        {
          name: '13',
          info: { license: '' }
        },
        {
          name: '14',
          info: { license: '' }
        },
        {
          name: '15',
          info: { license: '' }
        },
        {
          name: '16',
          info: { license: '' }
        }
      ],
      visible: false,
      currentRtsp: '',
      currentTitle: '',
      timer: null
    }
  },
  created() {
    this.getDoorQueue()
    this.getSalaCamer()
    this.timer = setInterval(() => {
      this.getDoorQueue() // 卸料门-车辆
    }, 60000)
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    async getSalaCamer() {
      const { data, success } = await findDtCameraVideo()
      if (success) {
        this.salaCameraUrl = data[0].rtsp
      }
    },
    async getDoorQueue() {
      const { success, data } = await findDoorQueue({
        pageNum: 1,
        pageSize: 20
      })
      if (success) {
        this.doorList.forEach((door) => {
          data.list.map((el) => {
            if (door.name === el.doorNo.slice(-2)) {
              door.info = el
            }
          })
        })
      }
    },
    filterLicense(val, key) {
      let current = ''
      const wait = []
      val?.split(',').map((el, index) => {
        if (index === 0) {
          current = el
        } else {
          wait.push(el)
        }
      })
      if (key === 'current') {
        return current
      } else {
        return wait.join()
      }
    },
    handleVideoClick(url, name) {
      if (!url) return
      this.currentRtsp = url
      this.currentTitle = name
      this.visible = true
    },
    handleDialogClose() {
      this.visible = false
      this.currentRtsp = ''
      this.currentTitle = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.sala-main {
  position: relative;
  height: 100%;
  .sala-top {
    @include flex(center);
    padding: 10px 0;
    font-size: 48px;
    font-weight: 700;
  }
  .sala-container {
    @include flex(space-around, flex-start);
    height: 92%;
    .box {
      width: 48%;
      height: 90%;
    }
    .sala-left {
      border: 1px solid;
      border-radius: 4px;
      background-color: #eee;
      cursor: pointer;
    }
    .sala-right {
      .door-list {
        @include flex(space-evenly);
        height: 100%;
        flex-wrap: wrap;
        .door-item {
          position: relative;
          width: 24%;
          height: 24%;
          border: 1px solid;
          border-radius: 4px;
          .item-video {
            height: 80%;
            background-color: #eee;
            border-bottom: 1px solid;
            &.has-video {
              cursor: pointer;
            }
            img {
              display: block;
              width: 100%;
              height: 100%;
            }
          }
          .title {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 10%;
            background-color: rgba($color: #fff, $alpha: .9);
            text-align: center;
            /* &.normal {
              background-color: rgba($color: #00ff00, $alpha: .6);
            }
            &.error {
              background-color: rgba($color: #ff0000, $alpha: .6);
            } */
          }
          .info {
            @include flex;
            padding-left: 5px;
            .text {
              width: 57%;
              @include ellipsis;
              &.current {
                color: $state-success-dark;
              }
              &.wait {
                color: $state-warning-dark;
              }
            }
          }
        }
      }
    }
  }
  .reload {
    position: absolute;
    top: 30px;
    right: 25px;
  }
}
</style>
