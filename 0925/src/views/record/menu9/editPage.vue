<template>
  <div>
    <dialog-box ref="dialog" :title="type === 'add' ? '添加配置' : '更新配置'" width="40%" :is-control="false" @toSubmit="handleRegister" @toClear="toClearDia">
      <el-form ref="resForm" :inline="true" label-position="left" :model="registerForm" :rules="resRules" label-width="80px" class="register-form">
        <el-row>
          <el-col :span="12">
            <el-form-item label="行车编号" prop="craneNo">
              <el-select v-model="registerForm.craneNo" placeholder="行车编号">
                <el-option
                  v-for="item in craneNoOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-input-number v-model="registerForm.priority" :min="1" :max="1000" />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="当前堆料" prop="currentDlArea">
              <el-select v-model="registerForm.currentDlArea" multiple placeholder="堆料区">
                <el-option
                  v-for="item in areaOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前投料" prop="currentTlArea">
              <el-select v-model="registerForm.currentTlArea" multiple placeholder="投料区">
                <el-option
                  v-for="item in areaOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row> -->
        <el-row>
          <el-col :span="12">
            <el-form-item label="职责类型" prop="dutyType">
              <el-select v-model="registerForm.dutyType" :disabled="type === 'update'" placeholder="职责类型" @change="dutyTypeChange">
                <el-option
                  v-for="item in dutyTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职责编号" prop="dutyNo">
              <el-select v-model="registerForm.dutyNo" multiple placeholder="职责编号">
                <el-option
                  v-for="item in dutyNoOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="registerForm.remarks"
                type="textarea"
                :rows="3"
                placeholder="请输入内容"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </dialog-box>
  </div>
</template>

<script>
import { craneDutyConfig } from '@/api/disCrane'
import dialogBox from '@/components/dialog'
import { disAreaInfo } from '@/api/pitArea'

export default {
  components: { dialogBox },
  props: {
    type: {
      type: String,
      default: 'add'
    }
  },
  data() {
    return {
      registerForm: {
        craneNo: '',
        // currentDlArea: [],
        // currentTlArea: [],
        dutyType: '',
        dutyNo: [],
        priority: 20,
        remarks: ''
      },
      resRules: {
        craneNo: [{ required: true, message: '请选择行车编号', trigger: 'blur' }],
        // currentDlArea: [{ required: true, message: '请选择当前堆料区', trigger: 'blur' }],
        // currentTlArea: [{ required: true, message: '请选择当前投料区', trigger: 'blur' }],
        dutyType: [{ required: true, message: '请选择职责类型', trigger: 'blur' }],
        dutyNo: [{ required: true, message: '请选择职责编号', trigger: 'blur' }]
      },
      craneNoOptions: [
        {
          value: 'crane01',
          label: '1号行车'
        },
        {
          value: 'crane02',
          label: '2号行车'
        },
        {
          value: 'crane03',
          label: '3号行车'
        }
      ],
      areaOptions: [
        {
          value: 'area01',
          label: '区域1'
        },
        {
          value: 'area02',
          label: '区域2'
        },
        {
          value: 'area03',
          label: '区域3'
        },
        {
          value: 'area04',
          label: '区域4'
        },
        {
          value: 'area05',
          label: '区域5'
        },
        {
          value: 'area06',
          label: '区域6'
        },
        {
          value: 'area07',
          label: '区域7'
        },
        {
          value: 'area08',
          label: '区域8'
        },
        {
          value: 'area09',
          label: '区域9'
        },
        {
          value: 'area10',
          label: '区域10'
        }
      ],
      dutyTypeOptions: [
        {
          value: 'PMP',
          label: '投料职责'
        },
        {
          value: 'AREA',
          label: '堆料职责'
        }
      ],
      dlList: [],
      dutyNoOptions: []
    }
  },
  // computed: {
  //   dutyNoOptions() {
  //     if (this.registerForm.dutyType === 'PMP') {
  //       return [
  //         {
  //           value: 'materialPortNo01',
  //           label: '一号炉'
  //         },
  //         {
  //           value: 'materialPortNo02',
  //           label: '二号炉'
  //         },
  //         {
  //           value: 'materialPortNo03',
  //           label: '三号炉'
  //         },
  //         {
  //           value: 'materialPortNo04',
  //           label: '四号炉'
  //         }
  //       ]
  //     } else {
  //       return this.dlList
  //     }
  //   }
  // },
  watch: {
    'registerForm.dutyType': {
      handler(newVal, oldVal) {
        // if (newVal !== oldVal) {
        //   this.registerForm.dutyNo.length = 0
        // }
        if (newVal === 'PMP') {
          this.dutyNoOptions = [
            {
              value: 'materialPortNo01',
              label: '一号炉'
            },
            {
              value: 'materialPortNo02',
              label: '二号炉'
            },
            {
              value: 'materialPortNo03',
              label: '三号炉'
            },
            {
              value: 'materialPortNo04',
              label: '四号炉'
            }
          ]
        } else {
          this.dutyNoOptions = this.dlList
        }
      }
      // immediate: true,
      // deep: true // 可以深度检测到 对象的属性值的变化
    }
  },
  created() {
    this.handleGetAreaInfo()
  },
  methods: {
    handleRegister() {
      this.$refs.resForm.validate((valid) => {
        if (valid) {
          const message = this.$props.type === 'add' ? '添加' : '修改'
          const datas = JSON.parse(JSON.stringify(this.registerForm))
          // datas.currentTlArea = datas..join()
          // datas.currentDlArea = datas.currentDlArea.join()
          datas.dutyNo = datas.dutyNo.join()
          craneDutyConfig(datas).then((res) => {
            const { success } = res
            if (success) {
              this.$message({
                message: message + '成功!',
                type: 'success'
              })
              this.$refs.dialog.dialogVisible = false
              this.$emit('getTableData')
            }
          })
        } else {
          console.log('验证失败')
          return false
        }
      })
    },
    toClearDia() {
      // 重置表单
      // this.$refs.resForm.resetFields() // 无效...
      if (this.$refs['resForm'] !== undefined) {
        this.$refs['resForm'].resetFields()
      }
      // this.$nextTick(() => {
      //   this.$refs['resForm'].resetFields()
      // })
      // setTimeout(() => {
      //   this.$refs['resForm'].resetFields()
      // }, 0)
      // this.registerForm.craneNo = ''
      // this.registerForm.currentDlArea = []
      // this.registerForm.currentTlArea = []
      // this.registerForm.dutyType = ''
      // this.registerForm.dutyNo = []
      // this.registerForm.priority = ''
      // this.registerForm.remarks = ''
    },
    async handleGetAreaInfo() {
      const { success, data } = await disAreaInfo({
        pageNum: 1,
        pageSize: 10
      })
      if (success) {
        this.dlList.length = 0
        data.list.map((el) => {
          if (el.areaStatus === 'DL') {
            this.dlList.push({
              value: el.areaNo,
              label: el.areaName
            })
          }
        })
      }
    },
    dutyTypeChange() {
      this.registerForm.dutyNo.length = 0
    }
  }
}
</script>

<style scoped lang="scss">

</style>
