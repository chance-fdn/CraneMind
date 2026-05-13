<template>
  <div>
    <dv-border-box-1>
      <div class="information" :style="{height: height+'px', overflow: overflow}">
        <div v-if="title" class="title">{{ title }}</div>
        <slot />
      </div>
    </dv-border-box-1>
  </div>
</template>

<script>
export default {
  props: {
    height: {
      type: [String, Number],
      default: 250
    },
    title: {
      type: String,
      default: ''
    },
    overflow: {
      type: String,
      default: 'hidden'
    }
  }
}
</script>

<style lang="scss" scoped>
.information {
  width: 100%;
  padding: 14px 16px;
  border-radius: 5px;
  box-sizing: border-box;
  .title {
    margin-left: 8px;
    font-size: 18px;
    font-weight: 700;
    color: $word-white;
  }
}
</style>
