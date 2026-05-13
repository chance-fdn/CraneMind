<template>
  <div :class="classObj" class="app-wrapper">
    <!-- <div id="screen" class="screen"> -->
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <sidebar class="sidebar-container" />
    <div class="main-container">
      <div :class="{'fixed-header':fixedHeader}">
        <navbar />
      </div>
      <app-main />
    </div>
    <!-- </div> -->
  </div>
</template>

<script>
import { Navbar, Sidebar, AppMain } from './components'
import ResizeMixin from './mixin/ResizeHandler'

export default {
  name: 'Layout',
  components: {
    Navbar,
    Sidebar,
    AppMain
  },
  mixins: [ResizeMixin],
  computed: {
    sidebar() {
      return this.$store.state.app.sidebar
    },
    device() {
      return this.$store.state.app.device
    },
    fixedHeader() {
      return this.$store.state.settings.fixedHeader
    },
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    }
  },
  mounted() {
    // 初始化自适应  ----在刚显示的时候就开始适配一次
    // this.handleScreenAuto()
    // 绑定自适应函数   ---防止浏览器栏变化后不再适配
    // window.onresize = () => this.handleScreenAuto()
  },
  destroyed() {
    // window.onresize = null
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    },
    // 数据大屏自适应函数
    handleScreenAuto() {
      const designDraftWidth = 1920// 设计稿的宽度
      const designDraftHeight = 942// 设计稿的高度
      // 根据屏幕的变化适配的比例
      const scale = (document.documentElement.clientWidth / document.documentElement.clientHeight) < (designDraftWidth / designDraftHeight)
        ? (document.documentElement.clientWidth / designDraftWidth)
        : (document.documentElement.clientHeight / designDraftHeight);
      // 缩放比例
      (document.querySelector('#screen')).style.transform = `scale(${scale}) translate(-50%)`
      // this.$message({
      //   message: `${document.documentElement.clientWidth} + ${document.documentElement.clientHeight} + ${scale} + ${designDraftWidth} + ${designDraftHeight}`
      // })
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "~@/styles/mixin.scss";
  @import "~@/styles/variables.scss";

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;
    &.mobile.openSidebar{
      position: fixed;
      top: 0;
    }
    .screen {
      display: inline-block;
      width: 1920px;  //设计稿的宽度
      height: 942px;  //设计稿的高度
      transform-origin: 0 0;
      position: absolute;
      left: 50%;
    }
  }
  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$sideBarWidth});
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>
