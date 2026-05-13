<template>
  <div>
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      border
      :row-key="(row) => row.id"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-if="selection"
        type="selection"
        width="50"
        align="center"
      />
      <el-table-column
        type="index"
        label="序号"
        width="50"
        align="center"
      />
      <!-- :show-overflow-tooltip="true" 当内容过长被隐藏时显示 tooltip -->
      <slot />
    </el-table>
    <el-pagination
      v-if="tableData.length && tableForm.total"
      background
      layout="total, sizes, prev, pager, next"
      :current-page="tableForm[tableParams.pageNum]"
      :page-size="tableForm[tableParams.pageSize]"
      :total="tableForm.total"
      :page-sizes="pageSizes"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @prev-click="handlePrevClick"
      @next-click="handleNextClick"
    />
  </div>
</template>

<script>
export default {
  props: {
    pageSizes: {
      type: Array,
      default: () => [10, 20, 30, 40, 50, 100]
    },
    tableParams: {
      type: Object,
      default: () => {
        return {
          pageNum: 'pageNum',
          pageSize: 'pageSize'
        }
      }
    },
    tableForm: {
      type: Object,
      default: () => {
        return {
          pageNum: 1,
          pageSize: 10,
          total: 0
        }
      }
    },
    tableData: {
      type: Array,
      default: () => []
    },
    selection: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false
    }
  },
  mounted() {
    this.getData()
  },
  methods: {
    handleSizeChange(val) {
      // 每条页数
      this.getData({ [this.tableParams.pageSize]: val })
    },
    handleCurrentChange(val) {
      // 当前页
      this.getData({ [this.tableParams.pageNum]: val })
    },
    handlePrevClick(val) {
      // 当前页
      this.getData({ [this.tableParams.pageNum]: val })
    },
    handleNextClick(val) {
      // 当前页
      this.getData({ [this.tableParams.pageNum]: val })
    },
    getData(val) {
      this.loading = true
      this.$emit('getTableData', val)
      setTimeout(() => {
        this.loading = false
      }, 600)
    },
    handleSelectionChange(val) {
      this.$emit('getSelectionData', val)
    }
  }
}
</script>
