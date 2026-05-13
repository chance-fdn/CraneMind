<template>
  <div class="feed-main">
    <div class="feed-top">
      垃圾坑投料口
    </div>
    <div class="reload">
      <el-button type="primary" @click="$router.go(0)">重新加载</el-button>
    </div>
    <div class="feed-container">
      <div :class="['video-all', {'has-video' : feedCameraUrl}]" @click="handleVideoClick(feedCameraUrl, '投料口全视图')">
        <video-test v-if="feedCameraUrl" :rtsp="feedCameraUrl" />
      </div>
      <div class="feed-list">
        <div v-for="(item) in feedList" :key="item.name" class="feed-item">
          <div class="title">{{ item.name || item.materialPortName }}</div>
          <div class="video-list">
            <div :class="['video-item', {'has-video' : item.leftRtsp}]" @click="handleVideoClick(item.leftRtsp, item.materialPortName + ' - 左')">
              <div class="video-title">{{ item.leftDegree.toFixed(1) + '%' }}</div>
              <video-test v-if="item.leftRtsp" :rtsp="item.leftRtsp" />
            </div>
            <div :class="['video-item', {'has-video' : item.rightRtsp}]" @click="handleVideoClick(item.rightRtsp, item.materialPortName + ' - 右')">
              <div class="video-title">{{ item.rightDegree.toFixed(1) + '%' }}</div>
              <video-test v-if="item.rightRtsp" :rtsp="item.rightRtsp" />
            </div>
          </div>
          <!-- <div class="pic-list">
            <div class="pic-item">
              <img :src="BASE_URL_TLK + `left${index + 1}.jpg`" alt="">
            </div>
            <div class="pic-item">
              <img :src="BASE_URL_TLK + `right${index + 1}.jpg`" alt="">
            </div>
          </div> -->
        </div>
      </div>

    </div>
    <el-dialog
      :title="currentTitle"
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
import { findPutMaterialPortList } from '@/api/pitArea'

export default {
  components: { videoTest },
  data() {
    return {
      feedList: [
        {
          name: '一号投料口',
          info: {}
        },
        {
          name: '二号投料口',
          info: {}
        },
        {
          name: '三号投料口',
          info: {}
        },
        {
          name: '四号投料口',
          info: {}
        }
      ],
      feedCameraUrl: '',
      BASE_URL_TLK: process.env.VUE_APP_PHOTO_API + 'tlk/',
      visible: false,
      currentRtsp: '',
      currentTitle: '',
      timer: null
    }
  },
  created() {
    this.handleGetPortList()
    this.timer = setInterval(() => {
      this.handleGetPortList() // 投料口信息
    }, 60000)
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    async handleGetPortList() {
      const { success, data } = await findPutMaterialPortList({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        this.feedList = data.list
        this.feedCameraUrl = data.list[0].fullViewRtsp
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
.feed-main {
  position: relative;
  height: 100%;
  .feed-top {
    @include flex(center);
    padding: 10px 0;
    font-size: 48px;
    font-weight: 700;
  }
  .reload {
    position: absolute;
    top: 30px;
    right: 25px;
  }
  .feed-container {
    height: 92%;
    overflow-y: auto;
    /* 滚动条宽度 */
    &::-webkit-scrollbar {
      width: 15px;
      height: 8px;
      background-color: transparent;
    }
    /* 滚动条颜色 */
    &::-webkit-scrollbar-thumb {
      background-color: rgba(28,81,148,0.6);
      border-radius: 10px;
    }
    .video-all {
      width: 50%;
      height: 50%;
      margin: 0 auto 20px;
      background-color: #eee;
      border: 1px solid;
      border-radius: 4px;
      &.has-video {
        cursor: pointer;
      }
    }
    .feed-list {
      @include flex(space-around, flex-start);
      flex-wrap: wrap;
      height: 100%;
    }
    .feed-item {
      width: 48%;
      height: 46%;
      border: 1px solid;
      border-radius: 4px;
      .title {
        @include flex(center);
        height: 10%;
        font-size: 18px;
        font-weight: 700;
      }
    }
    .video-list {
      @include flex;
      height: 90%;
      border-top: 1px solid;
      border-bottom: 1px solid;
      .video-item {
        position: relative;
        width: 50%;
        height: 100%;
        background-color: #eee;
        &:nth-child(1) {
          border-right: 1px solid;
        }
        &.has-video {
          cursor: pointer;
        }
        .video-title {
          position: absolute;
          top: 70px;
          right: 30px;
          width: 50px;
          height: 30px;
          font-size: 24px;
          color: #ffc000;
        }
      }
    }
    .pic-list {
      @include flex;
      height: 45%;
      .pic-item {
        width: 50%;
        height: 100%;
        background-color: #eee;
        &:nth-child(1) {
          border-right: 1px solid;
        }
        img {
          width: 100%;
          height: 100%;
          display: block;
        }
      }
    }
  }
}
</style>
