<template>
  <div class="dis-area">
    <div class="table-top">
      <tableSearch title="根据区域名称查询" desc="区域名称" @getTableData="getDisAreaInfo" />
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('areaTable')">导出</el-button>
    </div>
    <history-table ref="areaTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="areaName"
        label="区域名字"
      />
      <el-table-column
        prop="areaNo"
        label="区域编号"
      />
      <el-table-column
        label="区域状态"
        prop="areaStatus"
        sortable
        :filters="[{text: '发酵区', value: 'FJ'}, {text: '投料区', value: 'TL'}, {text: '间隔区', value: 'JG'}, {text: '堆料区', value: 'DL'}]"
        :filter-method="filterHandler"
      >
        <template slot-scope="scope">
          {{ filterDisArea(scope.row.areaStatus) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="fermentationTime"
        label="发酵时间 (天)"
        sortable
      />
      <el-table-column
        prop="isjg"
        label="是否需要揭盖"
      />
      <el-table-column
        prop="isls"
        label="是否需要沥水"
      />
      <el-table-column
        prop="isqd"
        label="是否需要清底"
      />
    </history-table>
  </div>
</template>

<script>
import { disAreaInfo } from '@/api/pitArea'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { filterDisArea } from '@/utils/filter'
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
    filterDisArea,
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await disAreaInfo(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
    },
    filterHandler(value, row, column) {
      const property = column['property']
      return row[property] === value
    }
  }
}
</script>

<style lang="scss" scoped>
.dis-area {
  padding: 30px 30px 60px;
  height: 100%;
  overflow-y: auto;
}
.table-top {
  @include flex(space-between);
}
</style>
