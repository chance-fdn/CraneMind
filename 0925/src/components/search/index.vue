<template>
  <div class="search">
    <div v-if="isShowSearch" class="search-title">{{ title }}:</div>
    <el-input
      v-if="isShowSearch"
      v-model.trim="inpVal"
      :placeholder="desc"
      prefix-icon="el-icon-search"
      @keyup.enter.native="toSearch"
    />
    <el-button type="primary" @click="toSearch">搜索</el-button>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: '请输入内容'
    },
    isShowSearch: {
      type: Boolean,
      default: true
    },
    searchValue: {
      type: String,
      default: 'findMsg'
    },
    pageName: {
      type: String,
      default: 'pageNum'
    }
  },
  data() {
    return {
      inpVal: ''
    }
  },
  methods: {
    toSearch() {
      this.$emit('getTableData', { [this.$props.pageName]: 1, [this.$props.searchValue]: this.inpVal })
    }
  }
}
</script>

<style scoped lang="scss">
.search {
  @include flex;
  margin-bottom: 10px;
  .search-title {
    margin-right: 10px;
    font-weight: 700;
  }
  .el-input {
    width: unset;
  }
  .el-button {
    margin: 0 10px;
  }
}
</style>
