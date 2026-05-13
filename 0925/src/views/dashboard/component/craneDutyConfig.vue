<template>
  <div class="crane-duty">
    <nativeTable :table-data="tableData" :table-column="tableColumn">
      <template #crane="scope">
        <div class="crane-list">
          <span>{{ scope.row.crane }}</span>
          <el-tooltip effect="dark" content="点击切换投炉状态" placement="top">
            <el-tag type="warning" class="port-item" :effect="scope.row.materialPortNo01 ? 'dark': 'plain'" @click.native="handleChangePort(scope.row.materialPortNo01, 'materialPortNo01', scope.row.value )">
              一号炉
            </el-tag>
          </el-tooltip>
          <el-tooltip effect="dark" content="点击切换投炉状态" placement="top">
            <el-tag type="warning" class="port-item" :effect="scope.row.materialPortNo02 ? 'dark': 'plain'" @click.native="handleChangePort(scope.row.materialPortNo02, 'materialPortNo02', scope.row.value )">
              二号炉
            </el-tag>
          </el-tooltip>
          <el-tooltip effect="dark" content="点击切换投炉状态" placement="top">
            <el-tag type="warning" class="port-item" :effect="scope.row.materialPortNo03 ? 'dark': 'plain'" @click.native="handleChangePort(scope.row.materialPortNo03, 'materialPortNo03', scope.row.value )">
              三号炉
            </el-tag>
          </el-tooltip>
          <el-tooltip effect="dark" content="点击切换投炉状态" placement="top">
            <el-tag type="warning" class="port-item" :effect="scope.row.materialPortNo04 ? 'dark': 'plain'" @click.native="handleChangePort(scope.row.materialPortNo04, 'materialPortNo04', scope.row.value )">
              四号炉
            </el-tag>
          </el-tooltip>
        </div>
      </template>
      <template #dlList="scope">
        <div v-for="item in scope.row.dlList" :key="item.dlArea" class="dl-list">
          <span style="margin-right: 10px;">{{ item.dlArea.slice(-2) + '区' }}</span>
          <el-switch
            v-model="item.dlState"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
            :active-value="1"
            :inactive-value="0"
            @change="handleDLSet(scope.row.value, item)"
          />
          <el-select v-model="item.dlDoors" multiple size="mini" style="width: 90px; margin-left: 10px; margin-right: 10px;" placeholder="卸料门">
            <el-option
              v-for="xlm in doorSetOptions"
              :key="xlm.value"
              :label="xlm.label"
              :value="xlm.value"
            />
          </el-select>
          <el-tooltip v-if="item.dlState === 0" content="开启堆料后才可设置卸料门" placement="top">
            <el-button disabled type="primary" size="mini">设置</el-button>
          </el-tooltip>
          <el-button v-else type="primary" size="mini" @click="handleSetDlDoors(scope.row.value, item)">设置</el-button>
        </div>
      </template>

      <template #jgList="scope">
        <div class="td-item">
          <!-- <span style="margin-right: 5px;">{{ scope.row.jgList.area.slice(-2) }}区</span> -->
          <el-tooltip v-if="scope.row.jgList.area === ' - '" content="请先设置揭盖区域" placement="top">
            <el-switch
              v-model="scope.row.jgList.state"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-text="开启"
              inactive-text="关闭"
              :active-value="1"
              :inactive-value="0"
              disabled
            />
          </el-tooltip>
          <el-switch
            v-else
            v-model="scope.row.jgList.state"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
            :active-value="1"
            :inactive-value="0"
            @change="handleOtherSet('JG', scope.row.value, scope.row.jgList)"
          />
        </div>
      </template>
      <template #lsList="scope">
        <div class="td-item">
          <!-- <span style="margin-right: 5px;">{{ scope.row.lsList.area.slice(-2) }}区</span> -->
          <el-tooltip v-if="scope.row.lsList.area === ' - '" content="请先设置沥水区域" placement="top">
            <el-switch
              v-model="scope.row.lsList.state"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-text="开启"
              inactive-text="关闭"
              :active-value="1"
              :inactive-value="0"
              disabled
            />
          </el-tooltip>
          <el-switch
            v-else
            v-model="scope.row.lsList.state"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
            :active-value="1"
            :inactive-value="0"
            @change="handleOtherSet('LS', scope.row.value, scope.row.lsList)"
          />
        </div>
      </template>
      <template #qdList="scope">
        <div class="td-item">
          <!-- <span style="margin-right: 5px;">{{ scope.row.qdList.area.slice(-2) }}区</span> -->
          <el-tooltip v-if="scope.row.qdList.area === ' - '" content="请先设置清底区域" placement="top">
            <el-switch
              v-model="scope.row.qdList.state"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-text="开启"
              inactive-text="关闭"
              :active-value="1"
              :inactive-value="0"
              disabled
            />
          </el-tooltip>
          <el-switch
            v-else
            v-model="scope.row.qdList.state"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
            :active-value="1"
            :inactive-value="0"
            @change="handleOtherSet('QD', scope.row.value, scope.row.qdList)"
          />
        </div>
      </template>
      <template #zlList="scope">
        <div class="td-item">
          <!-- <span style="margin-right: 5px;">{{ scope.row.zlList.area.slice(-2) }}区</span> -->
          <el-switch
            v-model="scope.row.zlList.state"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
            :active-value="1"
            :inactive-value="0"
            @change="handleOtherSet('ZL', scope.row.value, scope.row.zlList)"
          />
        </div>
      </template>
      <template #wgList="scope">
        <div class="dl-list">
          <el-select v-model="scope.row.wgList.wgAreas" multiple size="mini" style="width: 90px;" placeholder="区域" @change="handleWgAreaChange(scope.row)">
            <el-option
              v-for="area in areaSetOptions"
              :key="area.value"
              :label="area.label"
              :value="area.value"
            />
          </el-select>
          <!-- <el-button type="primary" size="mini" @click="handleSetDlDoors(scope.row.value, item)">设置</el-button> -->
        </div>
      </template>
    </nativeTable>
  </div>
</template>

<script>
import nativeTable from '@/components/nativeTable'
import { findBriefCraneDuty, delBriefCraneDuty, craneDutyConfig, updateCraneDutyDoor } from '@/api/disCrane'

export default {
  components: { nativeTable },
  data() {
    return {
      tableData: [
        {
          crane: '一号车',
          value: 'crane01',
          materialPortNo01: true,
          materialPortNo02: true,
          materialPortNo03: true,
          materialPortNo04: true,
          dlList: [],
          wgList: {
            wgAreas: [],
            oldWgAreas: []
          },
          jgList: {
            area: '',
            state: 0
          },
          lsList: {
            area: '',
            state: 0
          },
          qdList: {
            area: '',
            state: 0
          },
          zlList: {
            area: '',
            state: 0
          }
        },
        {
          crane: '二号车',
          value: 'crane02',
          materialPortNo01: true,
          materialPortNo02: true,
          materialPortNo03: true,
          materialPortNo04: true,
          dlList: [],
          wgList: {
            wgAreas: [],
            oldWgAreas: []
          },
          jgList: {
            area: '',
            state: 0
          },
          lsList: {
            area: '',
            state: 0
          },
          qdList: {
            area: '',
            state: 0
          },
          zlList: {
            area: '',
            state: 0
          }
        },
        {
          crane: '三号车',
          value: 'crane03',
          materialPortNo01: true,
          materialPortNo02: true,
          materialPortNo03: true,
          materialPortNo04: true,
          dlList: [],
          wgList: {
            wgAreas: [],
            oldWgAreas: []
          },
          jgList: {
            area: '',
            state: 0
          },
          lsList: {
            area: '',
            state: 0
          },
          qdList: {
            area: '',
            state: 0
          },
          zlList: {
            area: '',
            state: 0
          }
        }
      ],
      tableColumn: [
        {
          key: 'crane',
          label: '投料'
        },
        {
          key: 'dlList',
          label: '堆料'
        },
        {
          key: 'jgList',
          label: '揭盖',
          width: '170px'
        },
        {
          key: 'lsList',
          label: '沥水',
          width: '170px'
        },
        {
          key: 'qdList',
          label: '清底',
          width: '170px'
        },
        {
          key: 'zlList',
          label: '转料',
          width: '170px'
        },
        {
          key: 'wgList',
          label: '挖沟',
          width: '90px'
        }
      ],
      doorSetOptions: [
        {
          value: 'door01',
          label: '1号门'
        },
        {
          value: 'door02',
          label: '2号门'
        },
        {
          value: 'door03',
          label: '3号门'
        },
        {
          value: 'door04',
          label: '4号门'
        },
        {
          value: 'door05',
          label: '5号门'
        },
        {
          value: 'door06',
          label: '6号门'
        },
        {
          value: 'door07',
          label: '7号门'
        },
        {
          value: 'door08',
          label: '8号门'
        },
        {
          value: 'door09',
          label: '9号门'
        },
        {
          value: 'door10',
          label: '10号门'
        },
        {
          value: 'door11',
          label: '11号门'
        },
        {
          value: 'door12',
          label: '12号门'
        },
        {
          value: 'door13',
          label: '13号门'
        },
        {
          value: 'door14',
          label: '14号门'
        },
        {
          value: 'door15',
          label: '15号门'
        },
        {
          value: 'door16',
          label: '16号门'
        }
      ],
      areaSetOptions: [
        {
          value: 'area01',
          label: '一区'
        },
        {
          value: 'area02',
          label: '二区'
        },
        {
          value: 'area03',
          label: '三区'
        },
        {
          value: 'area04',
          label: '四区'
        },
        {
          value: 'area05',
          label: '五区'
        },
        {
          value: 'area06',
          label: '六区'
        },
        {
          value: 'area07',
          label: '七区'
        },
        {
          value: 'area08',
          label: '八区'
        },
        {
          value: 'area09',
          label: '九区'
        },
        {
          value: 'area10',
          label: '十区'
        }
      ]
    }
  },
  mounted() {
    this.handleGetTableData()
  },
  activated() {
    this.handleGetTableData()
  },
  methods: {
    async handleGetTableData() {
      const { success, data } = await findBriefCraneDuty()
      if (success) {
        data.map((el) => {
          this.tableData.forEach((ele, index, arr) => {
            if (el.craneNo === ele.value) {
              ele.dlList = JSON.parse(JSON.stringify(el.dl))
              ele.dlList.forEach((item) => {
                if (item.responsibleDischargingDoor) {
                  this.$set(item, 'dlDoors', item.responsibleDischargingDoor.split(','))
                } else {
                  this.$set(item, 'dlDoors', [])
                }
              })

              if (el.wg.length) {
                ele.wgList.wgAreas = JSON.parse(JSON.stringify(el.wg))
                ele.wgList.oldWgAreas = JSON.parse(JSON.stringify(el.wg))
              } else {
                ele.wgList.wgAreas = []
                ele.wgList.oldWgAreas = []
              }
              ele.jgList.area = el.jg.jgArea || ' - '
              ele.jgList.state = el.jg.jgState
              ele.lsList.area = el.ls.lsArea || ' - '
              ele.lsList.state = el.ls.lsState
              ele.qdList.area = el.qd.qdArea || ' - '
              ele.qdList.state = el.qd.qdState
              ele.zlList.area = el.zl.zlArea || '-'
              ele.zlList.state = el.zl.zlState
              ele.materialPortNo01 = el.tl.includes('materialPortNo01')
              ele.materialPortNo02 = el.tl.includes('materialPortNo02')
              ele.materialPortNo03 = el.tl.includes('materialPortNo03')
              ele.materialPortNo04 = el.tl.includes('materialPortNo04')
            }
          })
        })
      }
    },
    async handleChangePort(key, dutyNo, craneNo) {
      if (key) {
        // 关闭
        const { success } = await delBriefCraneDuty({
          craneNo,
          dutyType: 'TL',
          dutyNo
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      } else {
        // 开启
        const { success } = await craneDutyConfig({
          craneNo,
          dutyType: 'PMP',
          dutyNo
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      }
      this.handleGetTableData()
    },
    async handleDLSet(craneNo, data) {
      const { dlState, dlArea } = data
      if (dlState === 0) {
        // 关闭
        const { success } = await delBriefCraneDuty({
          craneNo,
          dutyType: 'DL',
          dutyNo: dlArea
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      } else {
        // 开启
        const { success } = await craneDutyConfig({
          craneNo,
          dutyType: 'AREA',
          dutyNo: dlArea
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      }
      this.handleGetTableData()
    },
    async handleSetDlDoors(craneNo, data) {
      data.responsibleDischargingDoor = data.dlDoors.join()
      const { responsibleDischargingDoor, dlArea } = data
      const { success } = await updateCraneDutyDoor({
        craneNo,
        dutyNo: dlArea,
        doors: responsibleDischargingDoor
      })
      if (success) {
        this.$message({
          message: '修改成功!',
          type: 'success'
        })
        this.handleGetTableData()
      }
    },
    async handleOtherSet(dutyType, craneNo, data) {
      const { state, area } = data
      if (state === 0) {
        const { success } = await delBriefCraneDuty({
          craneNo,
          dutyType,
          dutyNo: dutyType === 'ZL' ? '-' : area
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      } else {
        const { success } = await craneDutyConfig({
          craneNo,
          dutyType,
          dutyNo: dutyType === 'ZL' ? '-' : area
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      }
      this.handleGetTableData()
    },
    async handleWgAreaChange(data) {
      const { wgList, value } = data
      if (wgList.wgAreas.length > wgList.oldWgAreas.length) {
        const { success } = await craneDutyConfig({
          craneNo: value,
          dutyType: 'WG',
          dutyNo: wgList.wgAreas[wgList.wgAreas.length - 1]
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      } else {
        let current
        wgList.oldWgAreas.map((el) => {
          if (!wgList.wgAreas.some((ele) => ele === el)) {
            current = el
          }
        })
        const { success } = await delBriefCraneDuty({
          craneNo: value,
          dutyType: 'WG',
          dutyNo: current
        })
        if (success) {
          this.$message({
            message: '修改成功!',
            type: 'success'
          })
        }
      }
      this.$set(wgList, 'oldWgAreas', JSON.parse(JSON.stringify(wgList.wgAreas)))
      this.handleGetTableData()
    }
  }
}
</script>

<style scoped lang="scss">
.crane-duty {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  ::v-deep table {
    font-size: 18px;
    thead {
      border-color: $logo-special;
    }
    tbody td {
      border-color: $logo-special;
    }
  }
  ::v-deep el-switch__label--left {
    margin-right: 5px;
  }
  ::v-deep el-switch__label--right {
    margin-left: 5px;
  }
}
.crane-list {
  @include flex(space-between);
  .port-item {
    cursor: pointer;
  }
}
.dl-list {
  @include flex(center);
  &:not(:last-child) {
    margin-bottom: 8px;
  }
}
.td-item {
  @include flex(center);
}
</style>
