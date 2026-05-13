<template>
  <el-date-picker
    v-model="value"
    value-format="yyyy-MM-dd HH:mm:ss"
    type="datetime"
    placeholder="选择日期时间"
    @change="handleChange"
  />
</template>

<script>
export default {
  props: {
    originValue: {
      type: String,
      default: ''
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
      value: ''
    }
  },
  mounted() {
    if (this.$props.originValue) {
      this.value = this.$props.originValue
    }
  },
  methods: {
    handleChange(val) {
      this.$emit('datePickerChange', val, this.$props.arguments)
    }
  }
}
</script>
