<template>
  <div style="padding:30px;">
    <div class="table-top">
      <div class="search-top">
        <el-select v-model="tableForm.type" clearable placeholder="请选择设备类型">
          <el-option
            v-for="item in deviceTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <tableSearch title="根据设备名查询" desc="设备名" @getTableData="getDisAreaInfo" />
      </div>
      <el-button type="success" style="margin-bottom: 10px; margin-left: 10px;" @click="exportTableToExcel('deviceTable')">导出</el-button>
    </div>
    <history-table ref="deviceTable" :table-form="tableForm" :table-data="tableData" @getTableData="getDisAreaInfo">
      <el-table-column
        prop="deviceName"
        label="设备名"
      />
      <el-table-column
        label="设备类型"
        width="110"
      >
        <template slot-scope="scope">
          {{ filterDeviceType(scope.row.deviceType) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="deviceId"
        label="设备标识"
      />
      <el-table-column
        prop="systemId"
        label="设备对应系统标识"
      />
      <el-table-column
        prop="deviceIp"
        label="设备IP"
      />
      <el-table-column
        prop="devicePort"
        label="设备端口"
        width="80"
      />
      <el-table-column
        prop="createTime"
        label="添加时间"
        sortable
      />
      <el-table-column
        prop="updateTime"
        label="更新时间"
        sortable
      />
      <el-table-column
        label="状态"
        prop="status"
        sortable
      >
        <template slot-scope="scope">
          <div :class="['device-status', filterDeviceClass(scope.row.status)]">
            {{ scope.row.statusExplain || filterDeviceStatus(scope.row.status) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="remarks"
        label="备注"
      />
    </history-table>
  </div>
</template>

<script>
import { findDeviceList } from '@/api/device'
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
        type: '',
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      deviceTypeOptions: [
        // TG:抬杆； XLM：卸料门；HC：行车
        {
          label: '抬杆',
          value: 'TG'
        },
        {
          label: '卸料门',
          value: 'XLM'
        },
        {
          label: '行车',
          value: 'HC'
        },
        {
          label: '爪吊',
          value: 'ZD'
        },
        {
          label: '摄像头',
          value: 'SXT'
        },
        {
          label: 'LED灯',
          value: 'LED'
        },
        {
          label: '电机设备',
          value: 'DJ'
        },
        {
          label: '雷达设备',
          value: 'LD'
        },
        {
          label: '语音播报设备',
          value: 'YYBB'
        }
      ]
    }
  },
  methods: {
    filterDeviceType,
    exportTableToExcel,
    filterDeviceStatus(key) {
      let str = ''
      switch (key) {
        case '0':
          str = '正常'
          break
        default:
          str = key
          break
      }
      return str
    },
    filterDeviceClass(key) {
      let str = ''
      switch (key) {
        case '0':
          str = 'normal'
          break
        case '-1':
          str = 'error'
          break
        default:
          break
      }
      return str
    },
    async getDisAreaInfo(val) {
      // 数据改变,重新获取数据
      val && Object.assign(this.tableForm, val)
      const { data, success } = await findDeviceList(this.tableForm)
      // success && (this.tableData = data)
      if (success) {
        this.tableData = JSON.parse(JSON.stringify(data.list))
        this.tableForm.total = data.total
      }
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
.device-status {
  &.normal {
    color: $state-success;
  }
  &.error {
    color: red;
  }
}
</style>
