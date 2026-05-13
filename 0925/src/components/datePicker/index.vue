<template>
  <div>
    <el-date-picker
      v-model="value"
      type="datetimerange"
      value-format="yyyy-MM-dd HH:mm:ss"
      :picker-options="pickerOptions"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      align="right"
      :unlink-panels="true"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script>
export default {
  props: {
    originValue: {
      type: Array,
      default: () => []
    },
    arguments: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      value: '',
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      }
    }
  },
  mounted() {
    if (this.$props.originValue.length) {
      this.value = this.$props.originValue
    }
  },
  methods: {
    handleChange(val) {
      this.$emit('datePickerChange', val, this.$props.arguments)
    },
    handleFocus() {
      this.$emit('focus')
    },
    handleBlur() {
      this.$emit('blur')
    }
  }
}
</script>

<style lang="scss" scoped>
.el-date-editor {
  margin-right: 20px;
  margin-bottom: 10px;
}
</style>
