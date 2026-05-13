<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    :width="width"
    :before-close="handleBeforeClose"
    :modal="false"
    @close="handleClose"
  >
    <slot />
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '信息'
    },
    width: {
      type: String,
      default: '30%'
    },
    isControl: { // 控制确定时执行完事件再关闭
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('toSubmit')
      this.$props.isControl && (this.dialogVisible = false)
    },
    handleBeforeClose(done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    handleClose() {
      this.$emit('toClear')
    }
  }
}
</script>
