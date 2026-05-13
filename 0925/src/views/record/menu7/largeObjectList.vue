<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-select v-model="tableForm.status" clearable placeholder="请选择消息状态">
          <el-option
            v-for="item in recordOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <tableSearch title="根据记录编号查询" desc="记录编号" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('largeObjectTable')">导出</el-button>
    </div>

    <history-table ref="largeObjectTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="recordNo"
        label="记录编号"
      />
      <!-- <el-table-column
        prop="coordinateX"
        label="大物位置X坐标"
      />
      <el-table-column
        prop="coordinateY"
        label="大物位置Y坐标"
      />
      <el-table-column
        prop="coordinateZ"
        label="大物位置Z坐标"
      /> -->
      <el-table-column
        label="记录状态"
        prop="recordStatus"
        sortable
      >
        <template slot-scope="scope">
          {{ largeObjectStatus(scope.row.recordStatus) }}
        </template>
      </el-table-column>
      <el-table-column
        label="抓拍图片"
      >
        <template slot-scope="scope">
          <div class="table-img">
            <!-- <img v-if="scope.row.capturePhoto" :src="BASE_URL + scope.row.capturePhoto"> -->
            <el-image
              class="img-list"
              :src="BASE_URL + scope.row.capturePhoto"
              :preview-src-list="[BASE_URL + scope.row.capturePhoto]"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="recordTime"
        label="记录时间"
        sortable
      />
      <el-table-column
        label="操作"
      >
        <template slot-scope="scope">
          <div v-if="scope.row.recordStatus === '0'" class="actions">
            <el-button type="text" @click="handleNextStep(scope.row.id, '1')">不是大物</el-button>
            <el-button type="text" @click="handleNextStep(scope.row.id, '2')">是大物</el-button>
          </div>
          <div v-if="scope.row.recordStatus === '2'" class="actions">
            <el-button type="text" @click="handleNextStep(scope.row.id, '3')">大物已处理</el-button>
          </div>
        </template>
      </el-table-column>
    </history-table>
  </div>
</template>

<script>
import { findLargeObjectList, ackAlarm } from '@/api/disCrane'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { largeObjectStatus } from '@/utils/filter'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      // BASE_URL: process.env.VUE_APP_PHOTO_API + 'other/',
      BASE_URL: 'data:image/jpeg;base64,',
      tableData: [],
      tableForm: {
        findMsg: '',
        status: null,
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      recordOptions: [
        {
          label: '未确认', // -> 是大物/非大物
          value: '0'
        },
        {
          label: '非大物',
          value: '1'
        },
        {
          label: '是大物', // -> 大物已处理
          value: '2'
        },
        {
          label: '已处理',
          value: '3'
        }
      ]
    }
  },
  methods: {
    largeObjectStatus,
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findLargeObjectList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    async handleNextStep(id, status) {
      const { success } = await ackAlarm({
        id,
        status
      })
      if (success) {
        this.$message({
          message: '指令已下发，请稍后再操作',
          type: 'success'
        })
        // 算法那边什么时候操作完成? setTimeout
        this.getDisAreaInfo()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.table-img ::v-deep .el-image-viewer__close {
  color: #fff;
}
.table-top {
  @include flex(space-between);
}
.search-top {
  @include flex;
  ::v-deep .el-select {
    margin-bottom: 10px;
    margin-right: 10px;
  }
}
.table-img {
  img {
    width: 100px;
    height: 100px;
    display: block;
  }
}
</style>
