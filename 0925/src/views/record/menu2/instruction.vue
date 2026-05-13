<template>
  <div style="padding:30px;">
    <div class="table-top">
      <tableSearch title="根据设备编号查询" desc="设备编号" @getTableData="getDisAreaInfo" />
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('instructionTable')">导出</el-button>
    </div>
    <history-table ref="instructionTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        label="设备类型"
        prop="deviceType"
        sortable
        :filters="[{text: '抬杆', value: 'TG'}, {text: '卸料门', value: 'XLM'}, {text: '行车', value: 'HC'}]"
        :filter-method="filterHandler"
      >
        <template slot-scope="scope">
          {{ filterDeviceType(scope.row.deviceType) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="deviceNo"
        label="设备编号"
      />
      <el-table-column
        prop="writeTime"
        label="指令调度时间"
        sortable
      />
      <el-table-column
        prop="writeParam"
        label="指令参数"
      />
    </history-table>
  </div>
</template>

<script>
import { findInstructionList } from '@/api/instruction'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      tableData: [],
      tableForm: {
        findMsg: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  methods: {
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findInstructionList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    filterDeviceType(key) {
      let str = ''
      switch (key) {
        case 'TG':
          str = '抬杆'
          break
        case 'XLM':
          str = '卸料门'
          break
        case 'HC':
          str = '行车'
          break
        default:
          str = key
          break
      }
      return str
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    }
  }
}
</script>

<style lang="scss" scoped>
.table-top {
  @include flex(space-between);
}
</style>
