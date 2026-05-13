<template>
  <div class="">
    <el-table
      :data="tableData"
      :row-key="(row) => row.id"
      style="width: 100%"
    >
      <el-table-column
        label="#"
      >
        <template slot-scope="scope">
          {{ filterCraneNo(scope.row.craneNo) }}
        </template>
      </el-table-column>
      <el-table-column
        label="任务"
      >
        <template slot-scope="scope">
          {{ filterDisCraneTaskType(scope.row.taskType) }}
        </template>
      </el-table-column>
      <el-table-column
        label="执行"
      >
        <template slot-scope="scope">
          {{ filterDisCraneExecutionType(scope.row.executionType) }}
        </template>
      </el-table-column>
      <el-table-column
        label="抓取位置"
        align="center"
      >
        <template slot-scope="scope">
          {{ `${numTofixed(scope.row.startPointX)},${numTofixed(scope.row.startPointY)},${numTofixed(scope.row.startPointZ)}` }}
        </template>
      </el-table-column>
      <el-table-column
        label="投放位置1"
      >
        <template slot-scope="scope">
          {{ `${numTofixed(scope.row.x1)},${numTofixed(scope.row.y1)},${numTofixed(scope.row.z1)}` }}
        </template>
      </el-table-column>
      <el-table-column
        label="投放位置2"
      >
        <template slot-scope="scope">
          {{ `${numTofixed(scope.row.x2)},${numTofixed(scope.row.y2)},${numTofixed(scope.row.z2)}` }}
        </template>
      </el-table-column>
      <el-table-column
        label="状态"
      >
        <template slot-scope="scope">
          {{ filterDisCraneTaskStatus(scope.row.taskStatus) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { findTaskList } from '@/api/disCrane'
import { filterDisCraneTaskType, filterDisCraneExecutionType, filterDisCraneTaskStatus } from '@/utils/filter'

export default {
  components: {

  },
  data() {
    return {
      tableData: []
    }
  },
  created() {
    this.getDisAreaInfo()
  },
  methods: {
    filterDisCraneTaskType,
    filterDisCraneExecutionType,
    filterDisCraneTaskStatus,
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      // val && Object.assign(this.tableForm, val)
      const { data, success } = await findTaskList({
        pageNum: 1,
        pageSize: 20
      })
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        // this.tableForm.total = data.total
      }
    },
    filterCraneNo(str) {
      return str.match(/\d/g)?.join('') || ''
    }
  }
}
</script>

<style scoped lang="scss">
::v-deep .el-table {
  color: $word-normal;
  background-color: transparent;
  & th>.cell {
    padding-left: 3px;
    padding-right: 3px;
  }
  & .cell {
    padding-left: 3px;
    padding-right: 3px;
  }
  & thead {
    color: $word-normal;
  }
  & th,& tr {
    background-color: rgba(25, 25, 112,0.9);
  }
  /*& td,& th.is-leaf { // 下边框
     border-bottom: 1px solid red;
  }*/
  &.el-table--striped .el-table__body tr.el-table__row--striped td {
    background-color: rgba(25, 25, 112,0.8);
  }
  &.el-table--mini .el-table__body tr.hover-row:hover>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  & .el-table__body tr.hover-row.current-row>td, & .el-table__body tr.hover-row.el-table__row--striped.current-row>td,  & .el-table__body tr.hover-row.el-table__row--striped>td, & .el-table__body tr.hover-row>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  &.el-table--enable-row-hover .el-table__body tr:hover>td {
    background-color: rgba(25, 25, 112,0.9);
  }
  /* 滚动条 */
  & .el-table__body-wrapper {
    height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      width: 5px;
      height: 5px;
      &:horizontal {
        width: 6px;
        height: 6px;
      }
    }
    /* 两个滚动条交接处 -- x轴和y轴 */
    &::-webkit-scrollbar-corner {
      background-color: $logo-main;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(28,81,148,0.6);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
      background-color: $logo-main;
      /* border-radius: 3px; */
    }
  }
  /* 空值时 */
  & .el-table__empty-block {
    width: 100% !important;
    background-color: $logo-main;
  }
  /* 下边框 */
  &::before {
    background-color: unset;
  }
}
</style>
