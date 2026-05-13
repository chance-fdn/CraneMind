<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-select v-model="tableForm.notEnd" clearable placeholder="请选择消息类型">
          <el-option
            v-for="item in deviceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <tableSearch title="根据设备编号查询" desc="设备编号" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('deviceFaultTable')">导出</el-button>
    </div>
    <history-table ref="deviceFaultTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="deviceName"
        label="设备名称"
      />
      <el-table-column
        label="设备类型"
        prop="deviceType"
        :filters="[{text: '抬杆', value: 'TG'}, {text: '卸料门', value: 'XLM'}, {text: '行车', value: 'HC'}, {text: '爪吊', value: 'ZD'}, {text: '摄像头', value: 'SXT'}, {text: 'LED灯', value: 'LED'}, {text: '电机设备', value: 'DJ'}, {text: '雷达设备', value: 'LD'}, {text: '语音播报设备', value: 'YYBB'}]"
        :filter-method="filterHandler"
      >
        <template slot-scope="scope">
          {{ filterDeviceType(scope.row.deviceType) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="deviceNo"
        label="设备编号"
        sortable
      />
      <el-table-column
        prop="deviceIp"
        label="设备IP"
      />
      <el-table-column
        prop="falultTime"
        label="告警时间"
        sortable
      />
      <el-table-column
        prop="updateTime"
        label="更新时间"
        sortable
      />
      <el-table-column
        prop="falultEndTime"
        label="结束时间"
        sortable
      />
      <el-table-column
        prop="faultCode"
        label="设备故障说明"
      />
    </history-table>
  </div>
</template>

<script>
import { findDeviceFaultList } from '@/api/device'
import historyTable from '@/components/table'
import tableSearch from '@/components/search'
import { filterDeviceType } from '@/utils/filter'
import { exportTableToExcel } from '@/utils/tool'

export default {
  components: { historyTable, tableSearch },
  data() {
    return {
      tableData: [],
      tableForm: {
        findMsg: '',
        notEnd: 0,
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      deviceTypeOptions: [
        {
          label: '全部',
          value: 0
        },
        {
          label: '未结束',
          value: 1
        }
      ]
    }
  },
  methods: {
    filterDeviceType,
    exportTableToExcel,
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findDeviceFaultList(this.tableForm)
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
</style>
