<template>
  <div class="app-container">
    <div class="newSetting">
      <!-- <el-button type="primary" @click="handleOpen">新增<i class="el-icon-plus el-icon--right" /></el-button> -->
    </div>

    <el-collapse v-model="activeCollapse" style="margin-top: 50px">
      <el-collapse-item v-for="(collapse, index) in Object.keys(form)" :key="collapse" :title="filterGroup(collapse) + '设置 '" :name="index">
        <!-- v-show="!((collapse === 'ljc') && (itemIndex > 0 && itemIndex < 9))" -->
        <div v-for="(item, itemIndex) in form[collapse]" :key="item.id" class="form-item">
          <div class="label">{{ findMachineName(item) }}</div>
          <div class="content">
            <!-- <div v-if="'status' in item" class="status">
              <div class="desc">状态:</div>
              <el-radio-group v-model="item.status">
                <el-radio label="0">停用</el-radio>
                <el-radio label="1">启用</el-radio>
                <el-radio label="2">异常</el-radio>
              </el-radio-group>
            </div> -->
            <div v-if="'enterCarMax' in item && item.type === 'num'" class="status">
              <div class="desc">入场车辆最大值:</div>
              <el-input-number v-model.trim="item.enterCarMax" :min="0" />
            </div>
            <div v-if="'enterCarMax' in item && item.type === 'time'" class="status">
              <div class="desc">入场车辆最长离场时间(分钟):</div>
              <el-input-number v-model.trim="item.enterCarTime" :min="0" />
            </div>
            <div v-if="'isEnabled' in item && collapse !== 'wg'" class="status">
              <div class="desc">是否启用:</div>
              <el-switch v-model="item.isEnabled" active-value="1" inactive-value="0" active-color="#13ce66" inactive-color="#ff4949" />
            </div>
            <div v-if="'materialPortThreshold' in item" class="status">
              <div class="desc">阈值(%):</div>
              <el-input-number v-model.trim="item.materialPortThreshold" :min="0" :max="100" />
            </div>
            <div v-if="'putMaterialIntervalMax' in item" class="status">
              <div class="desc">最大间隔时间(分钟):</div>
              <el-input-number v-model.trim="item.putMaterialIntervalMax" :min="1" :max="200" />
            </div>
            <div v-if="'putMaterialIntervalMin' in item" class="status">
              <div class="desc">最小间隔时间(分钟):</div>
              <el-input-number v-model.trim="item.putMaterialIntervalMin" :min="1" :max="200" />
            </div>
            <!-- <div v-if="'width' in item" class="status">
              <div class="desc">区域宽度(米):</div>
              <el-input-number v-model.trim="item.width" :min="6" :max="12.5" />
            </div> -->
            <div v-if="'width' in item && collapse === 'ljc'">
              <div class="status">
                <div class="desc">开始位置(米):</div>
                <el-input v-model="item.startX" size="medium" style="width: 100px;" :precision="2" @change="changeStartX(itemIndex, item.startX)" />
                <div class="desc" style="margin-left: 30px;">结束位置(米):</div>
                <el-input v-model="item.endX" size="medium" style="width: 100px;" :precision="2" @change="changeEndX(itemIndex, item.endX)" />
              </div>
            </div>

            <div v-if="'startX' in item && collapse === 'wg'">
              <div class="status">
                <div class="desc">开始位置X(米):</div>
                <el-input v-model="item.startX" size="medium" style="width: 100px;" :precision="2" @change="changeWgStartX(itemIndex, item.startX)" />
                <div class="desc" style="margin-left: 30px;">结束位置X(米):</div>
                <el-input v-model="item.endX" size="medium" style="width: 100px;" :precision="2" @change="changeWgEndX(itemIndex, item.endX)" />

                <div class="desc" style="margin-left: 20px;">开始位置Y(米):</div>
                <el-input v-model="item.startY" size="medium" style="width: 100px;" :precision="2" @change="changeWgStartY(itemIndex, item.startY)" />
                <div class="desc" style="margin-left: 30px;">结束位置Y(米):</div>
                <el-input v-model="item.endY" size="medium" style="width: 100px;" :precision="2" @change="changeWgEndY(itemIndex, item.endY)" />
                <span style="margin-left: 20px;">( 最大: 10x7,  最小: 6x6 )</span>
              </div>
            </div>

            <div v-if="'startX' in item && collapse === 'xlm'">
              <div class="status">
                <div class="desc">抓料开始位置X(米):</div>
                <el-input v-model="item.zlStartX" size="medium" style="width: 100px;" :precision="2" @change="changeXlmZlStartX(itemIndex, item.zlStartX)" />
                <div class="desc" style="margin-left: 30px;">抓料结束位置X(米):</div>
                <el-input v-model="item.zlEndX" size="medium" style="width: 100px;" :precision="2" @change="changeXlmZlEndX(itemIndex, item.zlEndX)" />

                <div class="desc" style="margin-left: 30px;">抓料结束位置Y(米):</div>
                <el-input v-model="item.zlEndY" size="medium" style="width: 100px;" :precision="2" @change="changeXlmZlEndY(itemIndex, item.zlEndY)" />
                <span style="margin-left: 20px;">( 卸料门范围X: {{ item.startX + ' x ' + item.endX }},  抓料位置Y轴默认从0开始 )</span>
              </div>
            </div>

            <div v-if="'startX' in item && collapse === 'tlk'">
              <div class="status">
                <div class="desc">撒料开始位置(米):</div>
                <el-input v-model="item.startX" size="medium" style="width: 100px;" :precision="2" @change="changeTlkZlStartX(itemIndex, item.startX)" />
                <div class="desc" style="margin-left: 30px;">撒料结束位置(米):</div>
                <el-input v-model="item.endX" size="medium" style="width: 100px;" :precision="2" @change="changeTlkZlEndX(itemIndex, item.endX)" />
              </div>
            </div>

            <div v-if="'tlHeightMinCurrent' in item && item.type === 'tl'" class="status">
              <div class="desc">当前投料区最低高度(米):</div>
              <el-input-number v-model.trim="item.tlHeightMinCurrent" :min="0" :max="100" />
            </div>
            <div v-if="'tlHeightMinCurrent' in item && item.type === 'fl'" class="status">
              <div class="desc">放料需要提高的高度(米):</div>
              <el-input-number v-model.trim="item.flAddHeight" :min="8" :max="100" />
            </div>
            <!-- <div v-if="'total_width' in item" class="status">
              <div class="desc">总宽度(米):</div>
              <el-input-number v-model.trim="item.total_width" :min="parseFloat(item.width)" />
            </div> -->
            <div v-if="'medicalType' in item" class="status">
              <!-- <tableDatePicker :arguments="{type: item.medicalType}" :origin-value="[item.openTime_begin, item.openTime_end]" @datePickerChange="handleMedicalDateChange" /> -->
              <dateOnePicker
                :origin-value="item.openTime"
                :arguments="{type: item.medicalType}"
                @datePickerChange="handleDatePickerChange"
              />
              <el-button type="primary" style="margin-left: 10px" @click="handleMedicalChange(item.medicalType)">{{ item.medicalText }}</el-button>
            </div>
            <div v-if="'residueStatus' in item" class="status">
              <div class="desc">是否开启残渣模式:</div>
              <el-switch v-model="residueValue" active-value="0" inactive-value="3" active-color="#13ce66" inactive-color="#ff4949" @change="handleResidueChange" />
            </div>
            <div v-if="'closeTime' in item && collapse === 'zd'" class="status">
              <div class="desc">抓料闭合时间:</div>
              <el-input-number v-model.trim="item.closeTime" :min="0" :precision="2" :step="0.1" />
              <div style="margin-left: 10px;">(参考值: 14s)</div>
            </div>
            <div v-if="'openTime' in item && collapse === 'zd'" class="status">
              <div class="desc">撒料打开时间:</div>
              <el-input-number v-model.trim="item.openTime" :min="0" :precision="2" :step="0.1" />
              <div style="margin-left: 10px;">(参考值: 2.3s)</div>
            </div>
          </div>
        </div>

      </el-collapse-item>
    </el-collapse>

    <div class="btn-submit">
      <el-button type="primary" @click="toSubmit">确认修改</el-button>
    </div>

    <!-- <dialog-box ref="dialog" title="新增属性" :is-control="false" @toSubmit="handleAppend" @toClear="toClearDia">
      <div class="status">
        <div class="desc">新建组别:</div>
        <el-select v-model="newGroupName" placeholder="新建分组时">
          <el-option
            v-for="item in groupList.slice(1)"
            :key="item.groupName"
            :label="filterGroupName(item.groupName)"
            :value="item.groupName"
          />
        </el-select>
      </div>
      <div class="status value">
        <div class="desc">选择组别:</div>
        <el-select v-model="appendForm.groupName" placeholder="不新建分组,新建参数时">
          <el-option
            v-for="item in form"
            :key="item.groupName"
            :label="filterGroupName(item.groupName)"
            :value="item.groupName"
          />
        </el-select>
      </div>
      <div class="status value">
        <div class="desc">选择参数:</div>
        <el-select v-model="appendForm.paramNo" placeholder="请选择">
          <el-option
            v-for="item in filterParamList()"
            :key="item.paramNo"
            :label="item.name"
            :value="item.paramNo"
          />
        </el-select>
      </div>
      <div class="status value">
        <div v-if="appendForm.paramNo" class="desc">选择值:</div>
        <el-radio-group v-if="filterParamNo() === 'radio'" v-model="appendForm.value">
          <el-radio label="0">停用</el-radio>
          <el-radio label="1">启用</el-radio>
          <el-radio label="2">异常</el-radio>
        </el-radio-group>
        <el-input-number v-if="filterParamNo() === 'number'" v-model.trim="appendForm.value" :min="0" />
        <el-switch v-if="filterParamNo() === 'switch'" v-model="appendForm.value" active-value="1" inactive-value="0" active-color="#13ce66" inactive-color="#ff4949" />
      </div>
    </dialog-box> -->
  </div>
</template>

<script>
import { findParamSet, paramSet } from '@/api/setting'
import { filterGroup } from '@/utils/validate'
// import { disMedicalList } from '@/api/jeecg'
import { openSpecifiedTimeMedical, closeSpecifiedTimeMedical, getResidueStatus, openResidueModel, closeResidueModel } from '@/api/jeecg'
import dateOnePicker from '@/components/dateOnePicker'
// import dialogBox from '@/components/dialog'

export default {
  components: { dateOnePicker },
  data() {
    return {
      form: {},
      residueValue: '0',
      tlkAreaSet: [
        { start: 4.7, end: 12.5, limitStart: 3, limitEnd: 18 },
        { start: 36.7, end: 44.5, limitStart: 35, limitEnd: 50 },
        { start: 68.7, end: 76.5, limitStart: 65, limitEnd: 80 },
        { start: 99.7, end: 107.5, limitStart: 95, limitEnd: 110 }
      ],
      // 以下为无用属性
      dialogVisible: false,
      paramList: [
        {
          paramNo: 'width',
          name: '区域宽度'
        },
        {
          paramNo: 'total_width',
          name: '总宽度'
        },
        {
          paramNo: 'breaker',
          name: '开关'
        },
        {
          paramNo: 'scope',
          name: '范围'
        },
        {
          paramNo: 'interval_time',
          name: '间隔时间'
        },
        {
          paramNo: 'enter_car_max',
          name: '入场车辆最大值'
        },
        {
          paramNo: 'status',
          name: '状态'
        }
      ],
      groupList: [
        {
          groupName: 'ljc',
          num: 0,
          children: []
        },
        {
          groupName: 'xlm',
          num: 0,
          children: []
        },
        {
          groupName: 'tlk',
          num: 0,
          children: []
        },
        {
          groupName: 'ljd',
          num: 0,
          children: []
        },
        {
          groupName: 'fsl',
          num: 0,
          children: []
        },
        {
          groupName: 'dt',
          num: 0,
          children: []
        }
      ],
      appendForm: {
        groupName: '',
        paramNo: '',
        value: ''
      },
      newGroupName: '',
      activeCollapse: []
    }
  },
  // watch: {
  //   newGroupName: function(val) {
  //     val && (this.appendForm.groupName = '')
  //   },
  //   'appendForm.groupName': function(val) {
  //     val && (this.newGroupName = '')
  //   }
  // },
  created() {
    this.getFormData()
    this.handleGetResidueStatus()
    // disMedicalList()
  },
  methods: {
    filterGroup,
    // filterAreaMinMax(key) {
    //   let arr = [0, 0]
    //   switch (key) {
    //     case 0:
    //       arr[0] = 0
    //       arr[1] = 20
    //       break;

    //     default:
    //       break;
    //   }
    // },
    async getFormData(val) {
      const { data, success } = await findParamSet(val)
      if (success) {
        this.form = JSON.parse(JSON.stringify(data))
        this.form.ms = [
          {
            id: '000000001',
            msName: '医废模式开启',
            openTime: '',
            // openTime_begin: '',
            // openTime_end: '',
            medicalType: 'open',
            medicalText: '开启'
          },
          {
            id: '000000002',
            msName: '医废模式关闭',
            openTime: '',
            // openTime_begin: '',
            // openTime_end: '',
            medicalType: 'close',
            medicalText: '关闭'
          },
          {
            id: '000000003',
            msName: '残渣模式',
            residueStatus: '0'
          }
        ]
        // this.groupList.forEach((el) => {
        //   el.num = 0
        //   el.children = []
        //   this.form.map((ele) => {
        //     if (ele.groupName.includes(el.groupName)) {
        //       el.num++
        //       el.children.push(ele)
        //     }
        //     // 同步更改 staticForm
        //     switch (ele.groupName) {
        //       case 'LJC':
        //         this.staticForm[0].total_width = ele.total_width
        //         break
        //       case 'LJC1':
        //         this.staticForm[1].width = ele.width
        //         break
        //       case 'LJC10':
        //         this.staticForm[2].width = ele.width
        //         break
        //       default:
        //         break
        //     }
        //   })
        // })
      }
    },
    findMachineName(item) {
      const key = Object.keys(item).filter((el) => el.includes('Name'))
      let str = ''
      if (item.deviceId && item.deviceId.includes('crane')) {
        if (item.deviceId.includes('crane01')) {
          str = '一号车'
        }
        if (item.deviceId.includes('crane02')) {
          str = '二号车'
        }
        if (item.deviceId.includes('crane03')) {
          str = '三号车'
        }
      } else if (item.blockNo && item.blockNo.includes('wg')) {
        str = item.blockNo.slice(-2) + ' 区'
      } else {
        str = item[key]
      }

      return str
    },

    filterParamList() {
      const obj = this.form.filter((el) => el.groupName === this.appendForm.groupName)
      let newArr = []
      if (obj.length) {
        newArr = JSON.parse(JSON.stringify(Object.keys(obj[0])));
        (newArr.length > 1) && newArr.shift()
      }

      const newParamList = JSON.parse(JSON.stringify(this.paramList))
      newArr.forEach((ele) => {
        newParamList.forEach((el, index, arr) => {
          if (el.paramNo === ele) {
            arr.splice(index, 1)
          }
        })
      })
      return newParamList
    },
    filterParamNo() {
      let type = ''
      switch (this.appendForm.paramNo) {
        case 'width':
        case 'total_width':
        case 'scope':
        case 'interval_time':
        case 'enter_car_max':
          type = 'number'
          break
        case 'breaker':
          type = 'switch'
          break
        case 'status':
          type = 'radio'
          break
        default:
          break
      }
      return type
    },
    handleOpen() {
      this.$refs.dialog.dialogVisible = true
    },
    async handleAppend(val) {
      // 新增
      if (!this.appendForm.groupName && this.newGroupName) {
        const number = this.groupList.filter(el => el.groupName === this.newGroupName)[0].num + 1
        this.appendForm.groupName = this.newGroupName + number
      }
      if (!this.appendForm.groupName) {
        this.$message({
          message: '分组名必须添加',
          type: 'error'
        })
        return
      }

      const { success } = await paramSet([this.appendForm])
      if (success) {
        this.$message({
          message: '参数已添加成功',
          type: 'success'
        })
        this.$refs.dialog.dialogVisible = false
      }
      this.getFormData()
    },
    toClearDia() {
      // 重置表单
      setTimeout(() => {
        Object.keys(this.appendForm).map((el) => {
          this.appendForm[el] = ''
        })
      }, 0)
    },
    async toSubmit() {
      // 修改
      // 修改垃圾池分区数据
      // this.form.ljc[0].endX = this.form.ljc[0].width
      // this.form.ljc[9].startX = this.form.ljc[9].endX - this.form.ljc[9].width

      // const start = this.form.ljc[0].endX
      // const end = this.form.ljc[9].startX
      // const race = (end - start) / 8
      // 平分并设置
      this.form.ljc.forEach((el, index) => {
        el.width = el.endX - el.startX
        // if (index > 0 && index < 9) {
        //   el.startX = start + (index - 1) * (race)
        //   el.endX = start + index * race
        //   el.width = race
        // }
      })

      const { success } = await paramSet(this.form)
      success && this.$message({
        message: '参数已修改成功',
        type: 'success'
      })
      this.getFormData()
    },
    // handleMedicalDateChange(val, { type }) {
    //   this.form.ms.forEach((el) => {
    //     if (el?.medicalType === type) {
    //       el.openTime_begin = val[0]
    //       el.openTime_end = val[1]
    //     }
    //   })
    // },
    async handleMedicalChange(type) {
      const currentData = this.form.ms.filter((el) => el?.medicalType === type)[0]
      const api = type === 'open' ? openSpecifiedTimeMedical : closeSpecifiedTimeMedical
      const { success } = await api(currentData)
      success && this.$message({
        message: '修改成功',
        type: 'success'
      })
    },
    handleDatePickerChange(val, { type }) {
      this.form.ms.forEach((el) => {
        if (el?.medicalType === type) {
          el.openTime = val
        }
      })
    },
    async handleGetResidueStatus() {
      const { result } = await getResidueStatus()
      this.form.ms[2].residueStatus = result.openStatus
      this.residueValue = result.openStatus
    },
    async handleResidueChange(val) {
      this.form.ms[2].residueStatus = val
      const api = val === '0' ? openResidueModel : closeResidueModel
      const { success } = await api()
      success && this.$message({
        message: '修改成功',
        type: 'success'
      })
    },
    changeStartX(index, value) {
      this.form.ljc[index].startX = Number(this.form.ljc[index].startX.match(/\d+(\.\d+)?/).length ? this.form.ljc[index].startX.match(/\d+(\.\d+)?/)[0] : 0)
      // if (index > 0) {
      //   this.form.ljc[index - 1].endX = value
      // }
      // 一直加时
      if (this.form.ljc[index].startX >= this.form.ljc[index].endX) {
        this.form.ljc[index].startX = Number((this.form.ljc[index].endX - 6).toFixed(2))
        // this.$set(this.form.ljc[index], 'startX', this.form.ljc[index].endX - 6)
        // value = this.form.ljc[index].endX - 6
      }
      // 一直减时
      if (index > 0) {
        this.form.ljc[index - 1].endX = this.form.ljc[index].startX
        if (this.form.ljc[index - 1].endX <= this.form.ljc[index - 1].startX) {
          this.form.ljc[index - 1].endX = Number((this.form.ljc[index - 1].startX + 6).toFixed(2))
          this.form.ljc[index].startX = this.form.ljc[index - 1].endX
        }
      }
      if (index === 0 && this.form.ljc[index].startX < 0) {
        this.form.ljc[index].startX = Number((this.form.ljc[index].endX - 6).toFixed(2))
      }
      // this.$forceUpdate()
    },
    changeEndX(index, value) {
      this.form.ljc[index].endX = Number(this.form.ljc[index].endX.match(/\d+(\.\d+)?/) ? this.form.ljc[index].endX.match(/\d+(\.\d+)?/)[0] : 0)
      // if (index < 9) {
      //   this.form.ljc[index + 1].startX = value
      // }
      // 一直减时
      if (this.form.ljc[index].startX >= this.form.ljc[index].endX) {
        this.form.ljc[index].endX = Number((this.form.ljc[index].startX + 6).toFixed(2))
      }
      // 一直加时
      if (index < 9) {
        this.form.ljc[index + 1].startX = this.form.ljc[index].endX
        if (this.form.ljc[index + 1].startX >= this.form.ljc[index + 1].endX) {
          this.form.ljc[index + 1].startX = Number((this.form.ljc[index + 1].endX - 6).toFixed(2))
          this.form.ljc[index].endX = this.form.ljc[index + 1].startX
        }
      }
      if (index === 9 && this.form.ljc[index].endX > 121.4) {
        this.form.ljc[index].endX = Number((this.form.ljc[index].startX + 6).toFixed(2))
      }
    },
    changeWgStartX(index) {
      this.form.wg[index].startX = Number(this.form.wg[index].startX.match(/\d+(\.\d+)?/).length ? this.form.wg[index].startX.match(/\d+(\.\d+)?/)[0] : 0)
      // 加
      if (this.form.wg[index].startX >= this.form.wg[index].endX || (this.form.wg[index].endX - this.form.wg[index].startX) < 6) {
        this.form.wg[index].startX = Number((this.form.wg[index].endX - 6).toFixed(2))
      }
      // 减
      if (this.form.wg[index].startX < this.form.ljc[index - 1].endX || (this.form.wg[index].endX - this.form.wg[index].startX) > 10) {
        this.form.wg[index].startX = Number((this.form.wg[index].endX - 6).toFixed(2))
      }
      if (index === 0 && this.form.wg[index].startX < 0) {
        this.form.wg[index].startX = Number((this.form.wg[index].endX - 6).toFixed(2))
      }
    },
    changeWgEndX(index) {
      this.form.wg[index].endX = Number(this.form.wg[index].endX.match(/\d+(\.\d+)?/).length ? this.form.wg[index].endX.match(/\d+(\.\d+)?/)[0] : 0)
      // 减
      if (this.form.wg[index].endX <= this.form.wg[index].startX || (this.form.wg[index].endX - this.form.wg[index].startX) < 6) {
        this.form.wg[index].endX = Number((this.form.wg[index].startX + 6).toFixed(2))
      }
      // 加
      if (this.form.wg[index].endX > this.form.ljc[index + 1].startX || (this.form.wg[index].endX - this.form.wg[index].startX) > 10) {
        this.form.wg[index].endX = Number((this.form.wg[index].startX + 6).toFixed(2))
      }
      if (index === 9 && this.form.wg[index].endX > 121.4) {
        this.form.wg[index].endX = Number((this.form.wg[index].startX + 6).toFixed(2))
      }
    },
    changeWgStartY(index) {
      this.form.wg[index].startY = Number(this.form.wg[index].startY.match(/\d+(\.\d+)?/).length ? this.form.wg[index].startY.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.wg[index].startY < 0) {
        this.form.wg[index].startY = 0
      }
      if (this.form.wg[index].startY >= this.form.wg[index].endY) {
        this.form.wg[index].startY = Number((this.form.wg[index].endY - 6).toFixed(2))
      }
      if (this.form.wg[index].endY - this.form.wg[index].startY < 6) {
        this.form.wg[index].startY = 0
        this.form.wg[index].endY = 6
      }
      if (this.form.wg[index].endY - this.form.wg[index].startY > 7) {
        this.form.wg[index].startY = 0
        this.form.wg[index].endY = 7
      }
    },
    changeWgEndY(index) {
      this.form.wg[index].endY = Number(this.form.wg[index].endY.match(/\d+(\.\d+)?/).length ? this.form.wg[index].endY.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.wg[index].endY > 7) {
        this.form.wg[index].endY = 7
      }
      if (this.form.wg[index].endY <= this.form.wg[index].startY) {
        this.form.wg[index].endY = Number((this.form.wg[index].startY + 6).toFixed(2))
      }
      if (this.form.wg[index].endY - this.form.wg[index].startY < 6) {
        this.form.wg[index].startY = 0
        this.form.wg[index].endY = 6
      }
      if (this.form.wg[index].endY - this.form.wg[index].startY > 7) {
        this.form.wg[index].startY = 0
        this.form.wg[index].endY = 7
      }
    },
    changeXlmZlStartX(index) {
      this.form.xlm[index].zlStartX = Number(this.form.xlm[index].zlStartX.match(/\d+(\.\d+)?/).length ? this.form.xlm[index].zlStartX.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.xlm[index].zlStartX < 4.6) {
        this.form.xlm[index].zlStartX = this.form.xlm[index].startX
      }
      if (this.form.xlm[index].zlStartX > 115.3) {
        this.form.xlm[index].zlStartX = this.form.xlm[index].endX
      }
    },
    changeXlmZlEndX(index) {
      this.form.xlm[index].zlEndX = Number(this.form.xlm[index].zlEndX.match(/\d+(\.\d+)?/).length ? this.form.xlm[index].zlEndX.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.xlm[index].zlEndX < 4.6) {
        this.form.xlm[index].zlEndX = this.form.xlm[index].startX
      }
      if (this.form.xlm[index].zlEndX > 115.3) {
        this.form.xlm[index].zlEndX = this.form.xlm[index].endX
      }
    },
    changeXlmZlEndY(index) {
      this.form.xlm[index].endY = Number(this.form.xlm[index].endY.match(/\d+(\.\d+)?/).length ? this.form.xlm[index].endY.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.xlm[index].endY < 4.6) {
        this.form.xlm[index].zlEndX = 5.17
      }
      if (this.form.xlm[index].zlEndX > 10) {
        this.form.xlm[index].zlEndX = 5.17
      }
    },
    changeTlkZlStartX(index) {
      this.form.tlk[index].startX = Number(this.form.tlk[index].startX.match(/\d+(\.\d+)?/).length ? this.form.tlk[index].startX.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.tlk[index].startX < this.tlkAreaSet[index].limitStart || this.form.tlk[index].startX > this.tlkAreaSet[index].limitEnd) {
        this.form.tlk[index].startX = this.tlkAreaSet[index].start
      }
    },
    changeTlkZlEndX(index) {
      this.form.tlk[index].endX = Number(this.form.tlk[index].endX.match(/\d+(\.\d+)?/).length ? this.form.tlk[index].endX.match(/\d+(\.\d+)?/)[0] : 0)
      if (this.form.tlk[index].endX < this.tlkAreaSet[index].limitStart || this.form.tlk[index].endX > this.tlkAreaSet[index].limitEnd) {
        this.form.tlk[index].endX = this.tlkAreaSet[index].end
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100%;
  overflow-y: auto;
  .newSetting {
    float: right;
  }
  .form-item {
    margin-top: 15px;
    .label {
      font-weight: 700;
      font-size: 16px;
    }
    .content {
      @include flex;
      /* margin-top: 10px; */
    }
  }
  .status {
    @include flex;
    min-height: 40px;
    margin-right: 30px;
    &.value {
      margin-top: 10px;
      .desc {
        width: 60px;
      }
    }
  }
  .desc {
    margin-right: 15px;
    font-size: 14px;
  }
  .btn-submit {
    margin-top: 20px;
    padding-top: 10px;
    /* border-top: 1px solid; */
  }
}
::v-deep .el-collapse {
  .el-collapse-item__header {
    font-size: 20px;
    font-weight: 700;
  }
}
</style>
