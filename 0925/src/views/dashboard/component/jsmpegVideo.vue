<template>
  <!-- <div class="player-main" style="width: 100%; height: 100%;"> -->
  <canvas v-if="visible" ref="canvas" style="width: 100%; height: 100%;" />
  <!-- </div> -->
</template>

<script>
import JSMpeg from 'jsmpeg-player'
export default {
  props: {
    rtsp: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // rtsp: 'rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4'
      player: null,
      SERVER_IP: process.env.VUE_APP_LOCALHOST_IP,
      visible: true
    }
  },
  watch: {
    'rtsp': {
      handler(newVal, oldVal) {
        this.$nextTick(() => {
          // console.log('-------执行--------')
          // setTimeout(() => {
          this.player = new JSMpeg.Player(`ws://${this.SERVER_IP}:9999/rtsp?url=` + window.btoa(this.$props.rtsp), {
            canvas: this.$refs.canvas,
            preserveDrawingBuffer: true
          })
        })
      },
      immediate: true
      // deep: true // 可以深度检测到 对象的属性值的变化
    }
  },
  // mounted() {
  //   console.log('-------+++++++建立+++++++++--------')
  // },
  beforeDestroy() {
    // console.log('-------++++++++结束++++++++--------')
    this.visible = false
  }
  // mounted() {
  //   if (!this.$props.rtsp) return
  //   // console.log('----------------', this.$props.rtsp)
  //   // this.$nextTick 不能加 不然第一个监控会加载崩溃
  //   // 将rtsp视频流地址进行btoa处理一下
  //   this.player = new JSMpeg.Player(`ws://${this.SERVER_IP}:9999/rtsp?url=` + window.btoa(this.$props.rtsp), {
  //     canvas: this.$refs.canvas
  //   })
  // }
  // methods: {
  //   handleVideoClick() {
  //     this.visible = true
  //     new JSMpeg.Player(`ws://${this.SERVER_IP}:9999/rtsp?url=` + window.btoa(this.$props.rtsp), {
  //       canvas: this.$refs.bigCanvas
  //     })
  //   }
  // }
}
</script>

