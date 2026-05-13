<template>
  <div style="width: 100%; height: 100%; position: relative;">
    <div ref="container" style="width: 100%; height: 100%;" />
    <div ref="tips1" class="crane-tips" style="height: 120px;">
      <div class="tips-item">
        <div class="tips-label">行车{{ currentCraneData.deviceId[currentCraneData.deviceId.length - 1] }}：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.x) + ', ' + numTofixed(currentCraneData.y) + ', ' + numTofixed(currentCraneData.z) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">大车电流：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.bigCarCurrent) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">大车速度：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.bigCarSpeed) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">小车电流：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.smallCarCurrent) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">小车速度：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.smallCarSpeed) }}</div>
      </div>
    </div>
    <div ref="tips2" class="crane-tips">
      <div class="tips-item">
        <div class="tips-label">抓斗{{ currentCraneData.deviceId[currentCraneData.deviceId.length - 1] }}：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.x) + ', ' + numTofixed(currentCraneData.y) + ', ' + numTofixed(currentCraneData.z) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗电流：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabCurrent) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗速度：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabSpeed) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗开度：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabOpen) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗压力MA：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabPreMa) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗压力MB：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabPreMb) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗压力MP：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabPreMp) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗压力MP1：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabPreMp1) }}</div>
      </div>
      <div class="tips-item">
        <div class="tips-label">抓斗压力MP2：</div>
        <div class="tips-value">{{ numTofixed(currentCraneData.grabPreMp2) }}</div>
      </div>
    </div>
    <div class="test-xlm">
      <div v-for="(item, index) in xlmTestData" :key="item.key + index" class="xlm-item">
        <div class="xlm-span">{{ item.key }}</div>
        <div class="xlm-span">{{ item.avg }}</div>
        <div class="xlm-span">{{ item.max }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// 引入PCD加载器
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js'
// 字体要单独引入
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import * as TWEEN from '@tweenjs/tween.js'
import { findParamSet } from '@/api/setting'
import { findPartTrash, findPutMaterialPortList } from '@/api/pitArea'
import { selectAllCraneStatus } from '@/api/jeecg'
import { findDeviceFaultList } from '@/api/device'

/**
 * 三维建模(不包括大物平台)
 * 垃圾池(宽 正视的高 俯视的高): x 121.4, y 34(点云最高30米), z 26.4(不含投料口的6米)
 * 投料口: 16x6(中间3个间隔 - 17米)
 * 卸料门: 宽 3.8
 */
const MODELSET = {
  x: 137.4,
  y: 34,
  z: 32.4
}
/**
 * 垃圾爪: z(前后): 15.7至-15.7;  x(左右): -60至60;  y(上下): 14.7至-16
 * 连接垃圾爪的线: z(前后): 15.7至-15.7;  x(左右): -60至60;  mode.y(长度): 1至31
 * 大车: x(左右)
 *    左: -60.7至59.1
 *    右: -59.1至60.7
 * 小车: x(左右): -59.9至59.9;  z(前后): 15.7至-15.7
 */
const CRANERACE = {
  trackLeft: {
    xMin: -68.7,
    xMax: 67.1
  },
  trackRight: {
    xMin: -67.1,
    xMax: 68.7
  },
  slider: {
    xMin: -67.9,
    xMax: 67.9,
    zMin: 15.7,
    zMax: -15.7
  },
  claw: {
    xMin: -68,
    xMax: 68,
    yMin: 14.7,
    yMax: -16,
    zMin: 15.7,
    zMax: -15.7
  },
  line: {
    xMin: -68,
    xMax: 68,
    yMin: 1,
    yMax: 31,
    zMin: 15.7,
    zMax: -15.7
  }
}

export default {
  inject: ['parent'],
  data() {
    return {
      BASE_URL: process.env.VUE_APP_PHOTO_API + 'ljc/', // public
      currentCraneData: {
        deviceId: 'crane01',
        bigCarCurrent: '',
        bigCarSpeed: '',
        smallCarCurrent: '',
        smallCarSpeed: '',
        grabCurrent: '',
        grabSpeed: '',
        grabOpen: '',
        grabPreMa: '',
        grabPreMb: '',
        grabPreMp: '',
        grabPreMp1: '',
        grabPreMp2: '',
        x: 0,
        y: 0,
        z: 0
      },
      currentIndex: 0, // 提示框
      garbagePoolmodel: null, // 垃圾池点云模型
      garbagePoolAreamodel: null, // 垃圾池塌料模型
      modelScene: null, // 三维场景
      modelCamera: null,
      areaInfo: {
        area1: 10,
        area10: 10
      },
      xlmTestData: [],
      areaList: [
        {
          text: '一区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '二区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '三区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '四区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '五区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '六区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '七区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '八区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '九区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        },
        {
          text: '十区',
          textValue: null,
          lineValue: null,
          stock: null,
          xValue: null
        }
      ],
      environment: process.env.NODE_ENV,
      areaStock: [],
      timer1: null,
      timer2: null,
      inputList: [
        {
          key: '一号',
          value: null, // 投料口模型
          fontValue: null, // 编号
          id: 'materialPortNo01',
          degreeLeftValue: null,
          degreeRightValue: null,
          degreeLeft: 0,
          degreeRight: 0, // 占比
          materialPortThreshold: 0 // 阈值
        },
        {
          key: '二号',
          value: null,
          fontValue: null,
          id: 'materialPortNo02',
          degreeLeftValue: null,
          degreeRightValue: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0
        },
        {
          key: '三号',
          value: null,
          fontValue: null,
          id: 'materialPortNo03',
          degreeLeftValue: null,
          degreeRightValue: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0
        },
        {
          key: '四号',
          value: null,
          fontValue: null,
          id: 'materialPortNo04',
          degreeLeftValue: null,
          degreeRightValue: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0
        }
      ],
      craneList: [
        {
          key: 'crane01',
          trackLeft: null, // 左 大车
          trackRight: null, // 右 大车
          slider: null, // 小车
          claw: null, // 垃圾爪
          line: null, // 垃圾爪的连线
          trackForward: null, // 左右运动箭头的模型
          sliderForward: null, // 前后运动箭头的模型
          clawUp: null, // 上下运动箭头的模型
          clawUpLimit: null, // 上限位
          clawDownLimit: null, // 下限位
          sliderForwardLimit: null, // 前限位
          sliderBackendLimit: null, // 后限位
          avoidValue: null, // 避障文字
          waitValue: null, // 等待文字
          stepText: null, // 行车运行步骤 文字
          craneShow: null, // 行车信息展示的触发模型
          clawShow: null, // 垃圾爪信息展示的触发模型
          trackLeftCustomAnimate: null, // 大车动画 - 左
          trackRightCustomAnimate: null, // 大车动画 - 右
          sliderCustomAnimate: null, // 小车动画
          clawCustomAnimate: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null,
          autoValue: null, // 手动/自动
          taskShow: null // 计算状态
        },
        {
          key: 'crane02',
          trackLeft: null,
          trackRight: null,
          slider: null,
          claw: null,
          line: null,
          trackForward: null,
          sliderForward: null,
          clawUp: null,
          clawUpLimit: null,
          clawDownLimit: null,
          sliderForwardLimit: null,
          sliderBackendLimit: null,
          avoidValue: null,
          waitValue: null,
          stepText: null,
          craneShow: null,
          clawShow: null,
          trackLeftCustomAnimate: null, // 大车动画 - 左
          trackRightCustomAnimate: null, // 大车动画 - 右
          sliderCustomAnimate: null, // 小车动画
          clawCustomAnimate: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null,
          autoValue: null,
          taskShow: null
        },
        {
          key: 'crane03',
          trackLeft: null,
          trackRight: null,
          slider: null,
          claw: null,
          line: null,
          trackForward: null,
          sliderForward: null,
          clawUp: null,
          clawUpLimit: null,
          clawDownLimit: null,
          sliderForwardLimit: null,
          sliderBackendLimit: null,
          avoidValue: null,
          waitValue: null,
          stepText: null,
          craneShow: null,
          clawShow: null,
          trackLeftCustomAnimate: null, // 大车动画 - 左
          trackRightCustomAnimate: null, // 大车动画 - 右
          sliderCustomAnimate: null, // 小车动画
          clawCustomAnimate: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null,
          autoValue: null,
          taskShow: null
        }
      ],
      dischargeList: [
        {
          key: '01',
          value: null, // 卸料门模型
          fontValue: null, // 编号
          statusValue: null, // 状态
          statusAnimate: null,
          ranging: null // 测距
        },
        {
          key: '02',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '03',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '04',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '05',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '06',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '07',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '08',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '09',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '10',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '11',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '12',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '13',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '14',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '15',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        },
        {
          key: '16',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          ranging: null
        }
      ],
      arrowMaterialGreen: null,
      arrowMaterialRed: null,
      limitGeometry: null,
      fontContent: null,
      lastPopupTime1: 0,
      lastPopupTime2: 0,
      areaRace: [],
      craneAutoList: [
        {
          key: 'crane01',
          value: '自动'
        },
        {
          key: 'crane02',
          value: '自动'
        },
        {
          key: 'crane03',
          value: '自动'
        }
      ],
      timer3: null,
      isSart: false
      // taskFilter: ['错误', '计算中', '有任务', '无任务'],
      // modelX: 0
    }
  },
  watch: {
    'parent.craneData': {
      handler(newVal, oldVal) {
        if (this.isSart) {
          newVal && newVal.map((data, index) => {
            this.handleMoveClaw(data, index)
          })
          if (newVal) {
            Object.assign(this.currentCraneData, newVal[this.currentIndex])
          }
        }
      },
      // immediate: true,
      deep: true // 可以深度检测到 对象的属性值的变化
    },
    'parent.doorData': {
      handler(newVal, oldVal) {
        (this.isSart && newVal) && newVal.map((data, index) => {
          this.handleDoorStatusChange(data, index)
          this.handleDoorRanging(data, index)
        })
      },
      deep: true
    },
    'parent.xlmGarbageTest': {
      handler(newVal, oldVal) {
        this.xlmTestData = newVal
      },
      deep: true
    }
    // 'parent.taskLogInfo': {
    //   handler(newVal, oldVal) {
    //     (this.isSart && newVal) && this.handleShowTaskInfo(newVal)
    //   },
    //   deep: true
    // }
  },
  created() {
  },
  async mounted() {
    const dom = this.$refs.container
    // 创建场景
    const scene = new THREE.Scene()
    this.modelScene = scene
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, dom.clientWidth / dom.clientHeight, 0.1, 1000)
    this.modelCamera = camera
    camera.position.z = 41
    camera.position.y = 30
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(dom.clientWidth, dom.clientHeight)
    dom.appendChild(renderer.domElement)

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    // 设置控制器的初始位置
    controls.target.set(0, 0, 0)

    // 创建长方体几何体
    const geometry = new THREE.BoxGeometry(MODELSET.x, MODELSET.y, MODELSET.z) // x y z
    // 创建背景材质
    // 透明
    const transparentMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 })
    // 带图背景
    const backgroundTexture = new THREE.TextureLoader().load('/static/bg_pit.jpg')
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.DoubleSide })
    // 创建长方体网格
    const cube = new THREE.Mesh(geometry, [
      backgroundMaterial, // 左
      backgroundMaterial, // 右
      transparentMaterial, // 上
      backgroundMaterial, // 下
      transparentMaterial, // 前
      backgroundMaterial // 后
    ])
    // 设置长方体的位置
    cube.position.set(0, 0, 0)
    // 添加长方体到场景中
    scene.add(cube)

    // 添加投料口区域的墙壁
    const inputWallGeometry = new THREE.BoxGeometry(121.2, 29.9, 5.9)
    const inputWall = new THREE.Mesh(inputWallGeometry, backgroundMaterial)
    inputWall.position.set(0, -2, -13.2)
    scene.add(inputWall)
    // 添加投料口
    const inputGeometry = new THREE.BoxGeometry(16, 0.5, 5.7)
    this.inputList.forEach((el, index) => {
      el.value = new THREE.Mesh(inputGeometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }))
      el.value.position.set(33 * index - 49.5, 13, -13.2)
      scene.add(el.value)
    })

    // 添加左右区域的墙壁
    const wallGeometry = new THREE.BoxGeometry(8, 29.9, 32.3)
    const wallLeft = new THREE.Mesh(wallGeometry, backgroundMaterial)
    wallLeft.position.set(-64.7, -2, 0)
    const wallRight = new THREE.Mesh(wallGeometry, backgroundMaterial)
    wallRight.position.set(64.7, -2, 0)
    scene.add(wallLeft, wallRight)

    // 添加前面的黑色区域
    const frontBackgroundGeometry = new THREE.PlaneGeometry(MODELSET.x, 13, 1, 1)
    const frontBackgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    const backgroundPlane = new THREE.Mesh(frontBackgroundGeometry, frontBackgroundMaterial)
    backgroundPlane.position.set(0, -10.5, 16.2)
    // 添加背景平面到场景中
    scene.add(backgroundPlane)

    // 添加前面顶部的线
    const frontLineGeometry = new THREE.BoxGeometry(MODELSET.x, 0.1, 0.1)
    const frontLine = new THREE.Mesh(frontLineGeometry, frontBackgroundMaterial)
    frontLine.position.set(0, 16.9, 16.1)
    scene.add(frontLine)

    // 添加前面垃圾车的平台
    // const platformGeometry = new THREE.BoxGeometry(121.4, 1, 15)
    // const platform = new THREE.Mesh(platformGeometry, frontBackgroundMaterial)
    // platform.position.set(0, -3.5, 23.7)
    // scene.add(platform)

    // 卸料门
    const dischargeGeometry = new THREE.BoxGeometry(3.8, 5, 1)
    const dischargeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide })
    this.dischargeList.forEach((door, index) => {
      door.value = new THREE.Mesh(dischargeGeometry, [
        dischargeMaterial, // 左
        dischargeMaterial, // 右
        dischargeMaterial, // 上
        dischargeMaterial, // 下
        transparentMaterial, // 前
        transparentMaterial // 后
      ])
      door.value.position.set(6.8 * index - 51.3, -0.4, 16.5)
      scene.add(door.value)
    })

    // 添加圆柱体 大车
    const trackGeometry = new THREE.CylinderGeometry(0.3, 0.3, 32.4)
    // 小车
    const sliderGeometry = new THREE.BoxGeometry(1, 0.5, 1)
    const sliderMaterial = new THREE.MeshBasicMaterial({ color: 0x880000 })
    // 添加连接垃圾爪的线
    const clawMaterial = new THREE.MeshBasicMaterial({ color: 0x848b8e })
    const lineGeometry = new THREE.BoxGeometry(0.2, 1, 0.2)
    lineGeometry.translate(0, -0.5, 0) // 平移几何体的顶点

    // 行车信息展示的触发模型
    const transparentGeometryCrane = new THREE.BoxGeometry(3, 1, MODELSET.z)
    const transparentGeometryClaw = new THREE.BoxGeometry(3, 5, 1)

    this.craneList.forEach((el, index) => {
      // 大车
      el.trackLeft = new THREE.Mesh(trackGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true }))
      el.trackLeft.rotation.x = THREE.MathUtils.degToRad(90) // three.js以弧度为单位, 此方法可以使用角度
      el.trackLeft.position.set(index * 20 - 60.7, 17.3, 0)
      el.trackRight = new THREE.Mesh(trackGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true }))
      el.trackRight.rotation.x = THREE.MathUtils.degToRad(90) // three.js以弧度为单位, 此方法可以使用角度
      el.trackRight.position.set(index * 20 - 59.1, 17.3, 0)
      scene.add(el.trackLeft, el.trackRight)
      el.trackLeft.name = 'trackLeft' + index
      el.trackRight.name = 'trackRight' + index
      el.trackLeftCustomAnimate = new TWEEN.Tween(el.trackLeft.position).dynamic(true) // material: trackRight.material
      el.trackRightCustomAnimate = new TWEEN.Tween(el.trackRight.position).dynamic(true)
      el.trackLeftCustomGlintAnimate = new TWEEN.Tween(el.trackLeft.material).dynamic(true)
      el.trackRightCustomGlintAnimate = new TWEEN.Tween(el.trackLeft.material).dynamic(true)
      // 小车
      el.slider = new THREE.Mesh(sliderGeometry, sliderMaterial)
      el.slider.position.set(index * 20 - 59.9, 17.3, 15.7)
      scene.add(el.slider)
      el.slider.name = 'slider' + index
      el.sliderCustomAnimate = new TWEEN.Tween(el.slider.position).dynamic(true)
      // 连接垃圾爪的线
      el.line = new THREE.Mesh(lineGeometry, clawMaterial)
      el.line.position.set(index * 20 - 60, 17, 15.7)
      scene.add(el.line)
      el.line.name = 'line' + index
      el.lineCustomAnimate = new TWEEN.Tween({ position: el.line.position, length: el.line.scale }).dynamic(true)
      // 行车信息展示的触发模型 craneShow clawShow
      el.craneShow = new THREE.Mesh(transparentGeometryCrane, transparentMaterial)
      el.craneShow.position.set(index * 20 - 59.9, MODELSET.y / 2 + 0.5, 0)
      el.craneShow.name = 'craneShow' + index
      el.clawShow = new THREE.Mesh(transparentGeometryClaw, transparentMaterial)
      el.clawShow.position.set(index * 20 - 59.9, 14.5, MODELSET.z / 2 + 0.5)
      el.clawShow.name = 'clawShow' + index
      scene.add(el.craneShow, el.clawShow)
    })

    // 添加垃圾爪
    const loader = new GLTFLoader()
    const that = this
    loader.load('/static/Claw.glb', function(gltf) {
      that.craneList[0].claw = gltf.scene
      gltf.scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          // 应用材质到每个网格
          child.material = clawMaterial
        }
      })
      that.craneList[0].claw.position.set(-60, 14.7, 15.7)
      that.craneList[0].claw.scale.set(0.1, 0.1, 0.1)
      scene.add(that.craneList[0].claw)
      that.craneList[0].claw.name = 'claw0'

      // // 自定义动画
      that.craneList[0].clawCustomAnimate = new TWEEN.Tween(that.craneList[0].claw.position)
        .dynamic(true) // 动态更新
    }, undefined, function(error) {
      console.error(error)
    })
    loader.load('/static/Claw.glb', function(gltf) {
      that.craneList[1].claw = gltf.scene
      gltf.scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          // 应用材质到每个网格
          child.material = clawMaterial
        }
      })
      that.craneList[1].claw.position.set(-40, 14.7, 15.7)
      that.craneList[1].claw.scale.set(0.1, 0.1, 0.1)
      scene.add(that.craneList[1].claw)
      that.craneList[1].claw.name = 'claw1'

      // // 自定义动画
      that.craneList[1].clawCustomAnimate = new TWEEN.Tween(that.craneList[1].claw.position)
        .dynamic(true) // 动态更新
    }, undefined, function(error) {
      console.error(error)
    })
    loader.load('/static/Claw.glb', function(gltf) {
      that.craneList[2].claw = gltf.scene
      gltf.scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          // 应用材质到每个网格
          child.material = clawMaterial
        }
      })
      that.craneList[2].claw.position.set(-20, 14.7, 15.7)
      that.craneList[2].claw.scale.set(0.1, 0.1, 0.1)
      scene.add(that.craneList[2].claw)
      that.craneList[2].claw.name = 'claw2'

      // // 自定义动画
      that.craneList[2].clawCustomAnimate = new TWEEN.Tween(that.craneList[2].claw.position)
        .dynamic(true) // 动态更新
    }, undefined, function(error) {
      console.error(error)
    })

    // 箭头
    this.arrowMaterialGreen = new THREE.MeshBasicMaterial({ color: 0x2ec64f })
    this.arrowMaterialRed = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    this.limitGeometry = new THREE.BoxGeometry(2.5, 0.6, 1)

    // 添加垃圾坑模型
    const pcdLoader = new PCDLoader()
    pcdLoader.load(`${this.BASE_URL}add.pcd`, function(points) {
      // 获取点云数据
      var positions = points.geometry.attributes.position.array
      var colors = []
      // 根据高度设置颜色
      var minHeight = 0 // 设置最小高度
      var maxHeight = 500 // 设置最大高度
      for (var i = 0; i < positions.length; i += 3) {
        // var x = positions[i];
        // var y = positions[i + 1];
        var z = positions[i + 2]
        var normalizedHeight = (z - minHeight) / (maxHeight - minHeight) // 将高度归一化到 [0, 1] 范围
        // 根据归一化高度值计算颜色
        var color = new THREE.Color()
        color.setHSL(normalizedHeight, 1, 0.2) // 使用HSL颜色空间来设置颜色
        colors.push(color.r, color.g, color.b)
      }
      // 创建点云材质
      var material = new THREE.PointsMaterial({ vertexColors: true, size: 0.1 })
      points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      // 创建点云对象
      var pointCloud = new THREE.Points(points.geometry, material)
      pointCloud.scale.set(0.102, 0.1, 0.055)
      pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
      pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
      pointCloud.position.set(60.7, -16.9, -9.5) // -10
      // 将点云对象添加到场景中
      scene.add(pointCloud)
      that.garbagePoolmodel = pointCloud
    }, undefined, function(error) {
      console.error(error)
    })
    pcdLoader.load(`${this.BASE_URL}area.pcd`, function(points) {
      // 创建点云材质
      var material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 })
      // 创建点云对象
      var pointCloud = new THREE.Points(points.geometry, material)
      pointCloud.scale.set(0.102, 0.1, 0.055)
      pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
      pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
      pointCloud.position.set(60.7, -16.7, -9.5)
      // 将点云对象添加到场景中
      scene.add(pointCloud)
      that.garbagePoolAreamodel = pointCloud
    }, undefined, function(error) {
      console.error(error)
    })
    // pcdLoader.load(`${this.BASE_URL}add.pcd`, function(points) {
    //   // 获取点云数据
    //   var positions = points.geometry.attributes.position.array
    //   var colors = []
    //   // 根据高度设置颜色
    //   var minHeight = 0 // 设置最小高度
    //   var maxHeight = 450 // 设置最大高度
    //   for (var i = 0; i < positions.length; i += 3) {
    //     // var x = positions[i]
    //     var y = positions[i + 1]
    //     // var z = positions[i + 2]
    //     var normalizedHeight = (y - minHeight) / (maxHeight - minHeight) // 将高度归一化到 [0, 1] 范围
    //     // 根据归一化高度值计算颜色
    //     var color = new THREE.Color()
    //     color.setHSL(normalizedHeight, 1, 0.2) // 使用HSL颜色空间来设置颜色
    //     colors.push(color.r, color.g, color.b)
    //   }
    //   // 创建点云材质
    //   var material = new THREE.PointsMaterial({ vertexColors: true, size: 0.1 })
    //   points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    //   // 创建点云对象
    //   var pointCloud = new THREE.Points(points.geometry, material)
    //   pointCloud.scale.set(0.1, 0.1, 0.1)
    //   pointCloud.rotation.y = THREE.MathUtils.degToRad(-90)
    //   pointCloud.position.set(-19, -30 - 1, 16.2 - 0.2)
    //   // 将点云对象添加到场景中
    //   scene.add(pointCloud)
    //   that.garbagePoolmodel = pointCloud
    // }, undefined, function(error) {
    //   console.error(error)
    // })
    // pcdLoader.load(`${this.BASE_URL}area.pcd`, function(points) {
    //   // 创建点云材质
    //   var material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 })
    //   // 创建点云对象
    //   var pointCloud = new THREE.Points(points.geometry, material)
    //   pointCloud.scale.set(0.1, 0.1, 0.1)
    //   pointCloud.rotation.y = THREE.MathUtils.degToRad(-90)
    //   pointCloud.position.set(-19, -30, 16.2 - 0.2)
    //   // 将点云对象添加到场景中
    //   scene.add(pointCloud)
    //   that.garbagePoolAreamodel = pointCloud
    // }, undefined, function(error) {
    //   console.error(error)
    // })

    // 卸料门状态
    const circleGeometry = new THREE.SphereGeometry(0.7)
    this.dischargeList.forEach((el, index) => {
      el.statusValue = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true }))
      el.statusValue.position.set(6.75 * index - 51, 2, 17.5)
      scene.add(el.statusValue)
      el.statusAnimate = new TWEEN.Tween(el.statusValue.material).dynamic(true)
    })

    // 分区的线
    const areaLineGeometry = new THREE.BoxGeometry(0.2, 4, 0.2)
    const areaLineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    // 文字
    const fontLoader = new FontLoader()
    const fontPromise = new Promise((resolve, reject) => {
      fontLoader.load('/static/Alimama ShuHeiTi_Bold.json', font => {
        this.fontContent = font
        resolve(font) // Resolve the promise with the loaded font
      }, undefined, error => {
        reject(error) // Reject the promise if there's an error
      })
    })
    // 动画循环函数
    function animate() {
      requestAnimationFrame(animate)
      // 更新控制器
      controls.update()

      // 渲染场景
      renderer.render(scene, camera)
      // 更新Tween动画
      TWEEN.update()
    }

    // 监听鼠标移动事件
    // dom.addEventListener('mousemove', this.onDocumentMouseMove)
    dom.addEventListener('click', this.onDocumentClick)

    fontPromise.then(() => {
      return this.handleGetAreaInfo()
    }).then(() => {
      // 分区
      this.areaList.forEach((el, index) => {
        // 线
        el.lineValue = new THREE.Mesh(areaLineGeometry, areaLineMaterial)
        scene.add(el.lineValue)
        if (index === 0) {
          el.lineValue.position.set(this.areaInfo.area1 - 60.7, 11, -10)
        } else if (index === 9) {
          el.lineValue.position.set(60.7 - this.areaInfo.area10, 11, -10)
        } else {
          el.lineValue.position.set(this.areaRace[index].endX - 60.7, 11, -10)
        }
        // 编号
        el.textValue = new THREE.Mesh(new TextGeometry(el.text, {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        scene.add(el.textValue)
        if (index === 0) {
          el.textValue.position.set((this.areaInfo.area1 / 2) - 60.7 - 2.5, 10, -10)
        } else if (index === 9) {
          el.textValue.position.set(60.7 - (this.areaInfo.area10 / 2) - 2.5, 10, -10)
          const xText = (121.4 - this.areaInfo.area10).toFixed(2).toString()
          el.xValue = new THREE.Mesh(new TextGeometry(xText, {
            font: this.fontContent,
            size: 1.5,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0x0000FF }))
          scene.add(el.xValue)
          el.xValue.position.set(60.7 - this.areaInfo.area10 - 2, 7, -10)
        } else {
          el.textValue.position.set(this.areaRace[index].startX + this.areaRace[index].width / 2 - 60.7 - 2.5, 10, -10)
          const xText = this.areaRace[index].startX.toFixed(2).toString()
          el.xValue = new THREE.Mesh(new TextGeometry(xText, {
            font: this.fontContent,
            size: 1.5,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0x0000FF }))
          scene.add(el.xValue)
          el.xValue.position.set(this.areaRace[index].startX - 60.7 - 2, 7, -9.5)
        }
      })
    }).finally(() => {
      return this.handleGetTlkInfo()
    }).then(() => {
      this.inputList.forEach((el, index) => {
        // 投料口占比
        const degreeColor1 = (el.degreeLeft > el.materialPortThreshold) ? 0x00b050 : 0xff0000
        const degreeColor2 = (el.degreeRight > el.materialPortThreshold) ? 0x00b050 : 0xff0000
        el.degreeLeftValue = new THREE.Mesh(new TextGeometry(el.degreeLeft + '%', {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: degreeColor1 }))
        el.degreeRightValue = new THREE.Mesh(new TextGeometry(el.degreeRight + '%', {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: degreeColor2 }))
        el.degreeLeftValue.position.set(33 * index - 57, 14, -16)
        el.degreeRightValue.position.set(33 * index - 46, 14, -16)
        scene.add(el.degreeLeftValue, el.degreeRightValue)
      })
    }).finally(() => {
      // 投料口编号
      this.inputList.forEach((el, index) => {
        el.fontValue = new THREE.Mesh(new TextGeometry(el.key, {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        el.fontValue.position.set(33 * index - 52, 14, -16)
        scene.add(el.fontValue)
      })
      return this.handleGetAreaStock()
    }).then(() => {
      // 分区
      this.areaList.forEach((el, index) => {
        // 库存量
        el.stock = new THREE.Mesh(new TextGeometry(this.areaStock[index][index].toFixed(2), {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        scene.add(el.stock)
        if (index === 0) {
          el.stock.position.set((this.areaInfo.area1 / 2) - 60.7 - 3.5, 13, -10)
        } else if (index === 9) {
          el.stock.position.set(60.7 - (this.areaInfo.area10 / 2) - 3.5, 13, -10)
        } else {
          el.stock.position.set(this.areaRace[index].startX + this.areaRace[index].width / 2 - 60.7 - 3.5, 13, -10)
        }
      })
    }).finally(() => {
      // 卸料门的编号
      this.dischargeList.forEach((el, index) => {
        el.fontValue = new THREE.Mesh(new TextGeometry(el.key, {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.fontValue.position.set(6.9 * index - 53.3, 2.5, 16.5)
        scene.add(el.fontValue)
      })

      // 开始动画循环
      animate()
      this.isSart = true

      // 轮询
      this.timer1 = setInterval(() => {
        this.handleUpdateModel()
      }, 1200000)

      this.timer2 = setInterval(() => {
        this.handleGetAreaStock().finally(() => {
          this.areaList.forEach((ele) => {
            this.clearMesh(ele.stock)
          })
          setTimeout(() => {
            this.areaList.forEach((el, index) => {
              // 库存量
              el.stock = new THREE.Mesh(new TextGeometry(this.areaStock[index][index].toFixed(2), {
                font: this.fontContent,
                size: 1.5,
                height: 0
              }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
              scene.add(el.stock)
              if (index === 0) {
                el.stock.position.set((this.areaInfo.area1 / 2) - 60.7 - 3.5, 13, -10)
              } else if (index === 9) {
                el.stock.position.set(60.7 - (this.areaInfo.area10 / 2) - 3.5, 13, -10)
              } else {
                el.stock.position.set(this.areaRace[index].startX + this.areaRace[index].width / 2 - 60.7 - 3.5, 13, -10)
              }
            })
          }, 0)
        })
        this.handleGetTlkInfo().finally(() => {
          this.inputList.forEach((ele) => {
            this.clearMesh(ele.degreeLeftValue)
            this.clearMesh(ele.degreeRightValue)
          })
          setTimeout(() => {
            this.inputList.forEach((el, index) => {
              // 库存量
              const degreeColor1 = (el.degreeLeft > el.materialPortThreshold) ? 0x00b050 : 0xff0000
              const degreeColor2 = (el.degreeRight > el.materialPortThreshold) ? 0x00b050 : 0xff0000
              el.degreeLeftValue = new THREE.Mesh(new TextGeometry(el.degreeLeft + '%', {
                font: this.fontContent,
                size: 2,
                height: 0
              }), new THREE.MeshBasicMaterial({ color: degreeColor1 }))
              el.degreeRightValue = new THREE.Mesh(new TextGeometry(el.degreeRight + '%', {
                font: this.fontContent,
                size: 2,
                height: 0
              }), new THREE.MeshBasicMaterial({ color: degreeColor2 }))
              el.degreeLeftValue.position.set(33 * index - 57, 14, -16)
              el.degreeRightValue.position.set(33 * index - 46, 14, -16)
              scene.add(el.degreeLeftValue, el.degreeRightValue)
            })
          }, 0)
        })
      }, 10000)

      this.timer3 = setInterval(() => {
        this.handleUpdateAreaModel()
      }, 60000)
    })
  },
  beforeDestroy() {
    // console.log('------1-----')
    // 销毁监听器
    this.$refs.container.removeEventListener('mousemove', this.onDocumentMouseMove)
    // 销毁定时器
    // console.log('------2-----')
    clearInterval(this.timer1)
    clearInterval(this.timer2)
    clearInterval(this.timer3)
    // 销毁动画
    // console.log('------3-----')
    TWEEN.removeAll
    // 销毁模型
    // this.modelScene.remove()
    // console.log('------4-----')
    this.dischargeList.forEach((el) => {
      this.clearMesh(el.value)
      this.clearMesh(el.fontValue)
      this.clearMesh(el.statusValue)
      this.clearMesh(el.ranging)
    })
    this.inputList.forEach((el) => {
      this.clearMesh(el.value)
      this.clearMesh(el.fontValue)
      this.clearMesh(el.degreeLeftValue)
      this.clearMesh(el.degreeRightValue)
    })
    this.craneList.forEach((el) => {
      this.clearMesh(el.trackLeft)
      this.clearMesh(el.trackRight)
      this.clearMesh(el.slider)
      this.clearGltf(el.claw)
      this.clearMesh(el.line)
      this.clearGltf(el.sliderForward)
      this.clearGltf(el.clawUp)
      this.clearGltf(el.trackForward)
      this.clearGltf(el.clawUpLimit)
      this.clearGltf(el.clawDownLimit)
      this.clearMesh(el.sliderForwardLimit)
      this.clearMesh(el.sliderBackendLimit)
      this.clearMesh(el.avoidValue)
      this.clearMesh(el.waitValue)
      this.clearMesh(el.craneShow)
      this.clearMesh(el.clawShow)
      this.clearMesh(el.stepText)
      this.clearMesh(el.autoValue)
    })
    this.areaList.forEach((el) => {
      this.clearMesh(el.textValue)
      this.clearMesh(el.lineValue)
      this.clearMesh(el.stock)
      this.clearMesh(el.xValue)
    })
    // console.log('------5-----')
    this.clearGltf(this.garbagePoolmodel)
    this.clearGltf(this.garbagePoolAreamodel)
    // console.log('------6-----')
    this.modelScene.children.forEach(obj => {
      this.clearMesh(obj)
    })
    // console.log('------7-----', this.modelScene)
  },
  methods: {
    clearMesh(mesh) { // 销毁模型 并销毁对应的材质/物品  - 显隐操作不需要全部销毁
      if (mesh) {
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => {
            // 释放材质的资源
            material.dispose()
          })
        } else {
          mesh.material.dispose()
        }
        this.modelScene.remove(mesh)
        mesh = null
      }
    },
    clearGltf(gltf) {
      if (gltf) {
        // 释放模型的资源
        gltf.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
          // 释放每个网格的材质资源
            child.material.dispose()
          }
        })
        // 释放几何体的资源
        gltf.children.forEach(child => {
          if (child.isMesh) {
            child.geometry.dispose()
          }
        })
        this.modelScene.remove(gltf)
        gltf = null
      }
    },
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
    handleMoveClaw(data, index) {
      const THIS = this
      const loader = new GLTFLoader()
      const arrowX = this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.slider.xMin, CRANERACE.slider.xMax)
      this.modelX = arrowX
      // 大车  material: {opacity: 1}
      this.craneList[index].trackLeftCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.trackLeft.xMin, CRANERACE.trackLeft.xMax)
      }, 300).start(undefined, true)
      this.craneList[index].trackRightCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.trackRight.xMin, CRANERACE.trackRight.xMax)
      }, 300).start(undefined, true)
      // 小车
      this.craneList[index].sliderCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.slider.xMin, CRANERACE.slider.xMax),
        z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.slider.zMin, CRANERACE.slider.zMax)
      }, 300).start(undefined, true)
      // 垃圾爪
      this.craneList[index].clawCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax),
        y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax),
        z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax)
      }, 300).start(undefined, true)
      // 垃圾爪连线   不能改中心点,所以不能改大小 而要用缩放
      this.craneList[index].lineCustomAnimate.to({
        position: {
          x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.line.xMin, CRANERACE.line.xMax),
          z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.line.zMin, CRANERACE.line.zMax)
        },
        length: { y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.line.yMin, CRANERACE.line.yMax) }
      }, 300).start(undefined, true)
      // craneShow clawShow
      this.craneList[index].craneShow.position.set(arrowX, MODELSET.y / 2 + 0.5, 0)
      this.craneList[index].clawShow.position.set(arrowX, 14.5, MODELSET.z / 2 + 0.5)
      // 自动/手动运行 提示
      if (this.craneList[index].autoValue) {
        this.clearMesh(this.craneList[index].autoValue)
      }
      const text = data.craneStatus === '1' ? '自动' : '手动'
      this.craneList[index].autoValue = new THREE.Mesh(new TextGeometry(text, {
        font: this.fontContent,
        size: 3,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      this.craneList[index].autoValue.position.set(arrowX - 4, 18, -17)
      this.modelScene.add(this.craneList[index].autoValue)

      // 状态
      // 垃圾爪开合
      if (data.grabOpenFlag) {
        this.craneList[index].line.material.color.set(0x2ec64f)
      }
      if (data.grabCIsFlag) {
        this.craneList[index].line.material.color.set(0xff0000)
      }
      if (data.grabOpen) {
        this.craneList[index].claw.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // 应用材质到每个网格
            child.material = this.arrowMaterialGreen
          }
        })
      } else {
        this.craneList[index].claw.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // 应用材质到每个网格
            child.material = this.arrowMaterialRed
          }
        })
      }
      // 行车 左右
      if (data.bigCarLLS) { // 左限位
        this.craneList[index].trackLeft.material.color.set(0xff0000)
      } else {
        if (this.craneList[index].trackLeft.material.color.g !== 1) {
          this.craneList[index].trackLeft.material.color.set(0x00ff00)
        }
      }
      if (data.bigCarRLS) { // 右限位
        this.craneList[index].trackRight.material.color.set(0xff0000)
      } else {
        if (this.craneList[index].trackRight.material.color.g !== 1) {
          this.craneList[index].trackRight.material.color.set(0x00ff00)
        }
      }
      if (data.bigCarBrwdFlag || data.bigCarFrwdFlag) { // 左右运动 trackForward
        const direction = data.bigCarBrwdFlag ? 180 : 0
        const trackRace = data.bigCarBrwdFlag ? -3 : 3
        !this.craneList[index].trackForward && loader.load('/static/arrow.glb', function(gltf) {
          THIS.craneList[index].trackForward = gltf.scene
          THIS.craneList[index].trackForward.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              // 应用材质到每个网格
              child.material = THIS.arrowMaterialGreen
            }
          })
          THIS.craneList[index].trackForward.rotation.y = THREE.MathUtils.degToRad(direction)
          THIS.craneList[index].trackForward.position.set(arrowX + trackRace, 19, 0)
          THIS.craneList[index].trackForward.scale.set(15, 15, 15)
          THIS.modelScene.add(THIS.craneList[index].trackForward)
        }, undefined, function(error) {
          console.error(error)
        })
        if (this.craneList[index].trackForward) {
          !this.modelScene.children.includes(this.craneList[index].trackForward) && this.modelScene.add(this.craneList[index].trackForward)
          this.craneList[index].trackForward.rotation.y = THREE.MathUtils.degToRad(direction)
          this.craneList[index].trackForward.position.set(arrowX + trackRace, 19, 0)
        }
      } else {
        if (this.craneList[index].trackForward) {
          // 移除一个之前已经被移除(未添加)的模型，Three.js会简单地忽略这个操作
          this.modelScene.remove(this.craneList[index].trackForward)
        }
      }
      // 前后 sliderForward
      if (data.smallCarFLS) { // 前限位
        if (!this.craneList[index].sliderForwardLimit) {
          this.craneList[index].sliderForwardLimit = new THREE.Mesh(this.limitGeometry, this.arrowMaterialRed)
        }
        !this.modelScene.children.includes(this.craneList[index].sliderForwardLimit) && this.modelScene.add(this.craneList[index].sliderForwardLimit)
        this.craneList[index].sliderForwardLimit.position.set(arrowX, 17.3, -16.3)
      } else {
        if (this.craneList[index].sliderForwardLimit) {
          this.modelScene.remove(this.craneList[index].sliderForwardLimit)
        }
      }
      if (data.smallCarBLS) { // 后限位
        if (!this.craneList[index].sliderBackendLimit) {
          this.craneList[index].sliderBackendLimit = new THREE.Mesh(this.limitGeometry, this.arrowMaterialRed)
        }
        !this.modelScene.children.includes(this.craneList[index].sliderBackendLimit) && this.modelScene.add(this.craneList[index].sliderBackendLimit)
        this.craneList[index].sliderBackendLimit.position.set(arrowX, 17.3, 16.3)
      } else {
        if (this.craneList[index].sliderBackendLimit) {
          this.modelScene.remove(this.craneList[index].sliderBackendLimit)
        }
      }
      if (data.smallCarFrwdFlag || data.smallCarBrwdFlag) { // 前后运动
        const direction = data.smallCarFrwdFlag ? -90 : 90
        !this.craneList[index].sliderForward && loader.load('/static/arrow.glb', function(gltf) {
          THIS.craneList[index].sliderForward = gltf.scene
          THIS.craneList[index].sliderForward.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              // 应用材质到每个网格
              child.material = THIS.arrowMaterialGreen
            }
          })
          THIS.craneList[index].sliderForward.rotation.x = THREE.MathUtils.degToRad(90)
          THIS.craneList[index].sliderForward.rotation.z = THREE.MathUtils.degToRad(direction) // 前 -90; 后 90
          THIS.craneList[index].sliderForward.position.set(arrowX, 18, 0)
          THIS.craneList[index].sliderForward.scale.set(15, 15, 15)
          THIS.modelScene.add(THIS.craneList[index].sliderForward)
        }, undefined, function(error) {
          console.error(error)
        })
        if (this.craneList[index].sliderForward) {
          !this.modelScene.children.includes(this.craneList[index].sliderForward) && this.modelScene.add(this.craneList[index].sliderForward)
          this.craneList[index].sliderForward.rotation.z = THREE.MathUtils.degToRad(direction)
          this.craneList[index].sliderForward.position.set(arrowX, 18, 0)
        }
      } else {
        if (this.craneList[index].sliderForward) {
          this.modelScene.remove(this.craneList[index].sliderForward)
        }
      }
      // 上下 clawUp
      if (data.grabULS) { // 上限位 clawUpLimit
        !this.craneList[index].clawUpLimit && loader.load('/static/arrow.glb', function(gltf) {
          THIS.craneList[index].clawUpLimit = gltf.scene
          THIS.craneList[index].clawUpLimit.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              // 应用材质到每个网格
              child.material = THIS.arrowMaterialRed
            }
          })
          THIS.craneList[index].clawUpLimit.rotation.z = THREE.MathUtils.degToRad(90) // 上 90; 下 -90
          THIS.craneList[index].clawUpLimit.position.set(arrowX, 14, 16.5)
          THIS.craneList[index].clawUpLimit.scale.set(15, 15, 15)
          THIS.modelScene.add(THIS.craneList[index].clawUpLimit)
        }, undefined, function(error) {
          console.error(error)
        })
        if (this.craneList[index].clawUpLimit) {
          !this.modelScene.children.includes(this.craneList[index].clawUpLimit) && this.modelScene.add(this.craneList[index].clawUpLimit)
          this.craneList[index].clawUpLimit.position.set(arrowX, 14, 16.5)
        }
      } else {
        if (this.craneList[index].clawUpLimit) {
          this.modelScene.remove(this.craneList[index].clawUpLimit)
        }
      }
      if (data.grabDLS) { // 下限位 clawDownLimit
        !this.craneList[index].clawDownLimit && loader.load('/static/arrow.glb', function(gltf) {
          THIS.craneList[index].clawDownLimit = gltf.scene
          THIS.craneList[index].clawDownLimit.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              // 应用材质到每个网格
              child.material = THIS.arrowMaterialRed
            }
          })
          THIS.craneList[index].clawDownLimit.rotation.z = THREE.MathUtils.degToRad(-90) // 上 90; 下 -90
          THIS.craneList[index].clawDownLimit.position.set(arrowX, 14, 16.5)
          THIS.craneList[index].clawDownLimit.scale.set(15, 15, 15)
          THIS.modelScene.add(THIS.craneList[index].clawDownLimit)
        }, undefined, function(error) {
          console.error(error)
        })
        if (this.craneList[index].clawDownLimit) {
          !this.modelScene.children.includes(this.craneList[index].clawDownLimit) && this.modelScene.add(this.craneList[index].clawDownLimit)
          this.craneList[index].clawDownLimit.position.set(arrowX, 14, 16.5)
        }
      } else {
        if (this.craneList[index].clawDownLimit) {
          this.modelScene.remove(this.craneList[index].clawDownLimit)
        }
      }
      if (data.grabUrwdFlag || data.grabDrwdFlag) { // 上下运动
        const direction = data.grabUrwdFlag ? 90 : -90
        !this.craneList[index].clawUp && loader.load('/static/arrow.glb', function(gltf) {
          THIS.craneList[index].clawUp = gltf.scene
          THIS.craneList[index].clawUp.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              // 应用材质到每个网格
              child.material = THIS.arrowMaterialGreen
            }
          })
          THIS.craneList[index].clawUp.rotation.z = THREE.MathUtils.degToRad(direction) // 上 90; 下 -90
          THIS.craneList[index].clawUp.position.set(arrowX, 21.5, 0)
          THIS.craneList[index].clawUp.scale.set(15, 15, 15)
          THIS.modelScene.add(THIS.craneList[index].clawUp)
        }, undefined, function(error) {
          console.error(error)
        })
        if (this.craneList[index].clawUp) {
          !this.modelScene.children.includes(this.craneList[index].clawUp) && this.modelScene.add(this.craneList[index].clawUp)
          this.craneList[index].clawUp.rotation.z = THREE.MathUtils.degToRad(direction)
          this.craneList[index].clawUp.position.set(arrowX, 21.5, 0)
        }
      } else {
        if (this.craneList[index].clawUp) {
          this.modelScene.remove(this.craneList[index].clawUp)
        }
      }
      // 避障和等待 avoidValue waitValue
      if (data.bigCarAvoid) {
        if (!this.craneList[index].avoidValue) {
          this.craneList[index].avoidValue = new THREE.Mesh(new TextGeometry('避障', {
            font: this.fontContent,
            size: 1.5,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0xfda64a }))
        }
        !this.modelScene.children.includes(this.craneList[index].avoidValue) && this.modelScene.add(this.craneList[index].avoidValue)
        this.craneList[index].avoidValue.position.set(arrowX - 2, 18, 17)
      } else {
        if (this.craneList[index].avoidValue) {
          this.modelScene.remove(this.craneList[index].avoidValue)
        }
      }
      if (data.bigCarWait) {
        if (!this.craneList[index].waitValue) {
          this.craneList[index].waitValue = new THREE.Mesh(new TextGeometry('等待', {
            font: this.fontContent,
            size: 1.5,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0xfda64a }))
        }
        !this.modelScene.children.includes(this.craneList[index].waitValue) && this.modelScene.add(this.craneList[index].waitValue)
        this.craneList[index].waitValue.position.set(arrowX - 2, 15, 17)
      } else {
        if (this.craneList[index].waitValue) {
          this.modelScene.remove(this.craneList[index].waitValue)
        }
      }
      // 行车运行步骤 stepText
      if (data.commStep) {
        if (this.craneList[index].stepText) {
          this.clearMesh(this.craneList[index].stepText)
        }
        this.craneList[index].stepText = new THREE.Mesh(new TextGeometry(data.commStep, {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x880000 }))
        this.modelScene.add(this.craneList[index].stepText)
        this.craneList[index].stepText.position.set(arrowX - 1.5, 18, 14)
      } else {
        if (this.craneList[index].stepText) {
          this.clearMesh(this.craneList[index].stepText)
        }
      }
    },
    mapValueToRange(x, fromMin, fromMax, toMin, toMax) {
      // 首先将x从原始范围映射到0到1的范围
      const normalizedX = (x - fromMin) / (fromMax - fromMin)
      // 然后将0到1的范围映射到新的区间toMin到toMax
      const mappedValue = normalizedX * (toMax - toMin) + toMin
      return mappedValue
    },
    handleDoorStatusChange(data, index) {
      let color
      let glitter = false
      switch (data.status) {
        case 1: // 'opened' 绿
          color = 0x2ec64f
          break
        case 2: // 'closed' 红
          color = 0xff0000
          break
        case 3: // 'opening' 绿+闪
          color = 0x2ec64f
          glitter = true
          break
        case 4: // 'closeing' 红+闪
          color = 0xff0000
          glitter = true
          break
        default: // 'failure' 黄
          color = 0xfda64a
          break
      }
      this.dischargeList[index].statusValue.material.color.set(color)
      this.dischargeList[index].statusValue.material.opacity = 1
      this.dischargeList[index].statusAnimate.stop()
      if (glitter) {
        this.dischargeList[index].statusAnimate.to({
          opacity: 0.5
        }, 250).start(undefined, true).repeat(Infinity)
      }
    },
    handleDoorRanging(data, index) {
      this.clearMesh(this.dischargeList[index].ranging)
      // setTimeout(() => {
      this.dischargeList[index].ranging = new THREE.Mesh(new TextGeometry(data.rangeFinder.toFixed(2).toString(), {
        font: this.fontContent,
        size: 1.5,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xfda64a }))
      this.dischargeList[index].ranging.position.set(6.9 * index - 53.8, 5.5, 16.5)
      this.modelScene.add(this.dischargeList[index].ranging)
      // }, 0)
    },
    handleUpdateModel() {
      const pcdLoader = new PCDLoader()
      const THIS = this
      pcdLoader.load(`${this.BASE_URL}add.pcd`, function(points) {
        // 获取点云数据
        var positions = points.geometry.attributes.position.array
        var colors = []
        // 根据高度设置颜色
        var minHeight = 0 // 设置最小高度
        var maxHeight = 500 // 设置最大高度
        for (var i = 0; i < positions.length; i += 3) {
          // var x = positions[i];
          // var y = positions[i + 1]
          var z = positions[i + 2]
          var normalizedHeight = (z - minHeight) / (maxHeight - minHeight) // 将高度归一化到 [0, 1] 范围
          // 根据归一化高度值计算颜色
          var color = new THREE.Color()
          color.setHSL(normalizedHeight, 1, 0.2) // 使用HSL颜色空间来设置颜色
          colors.push(color.r, color.g, color.b)
        }
        // 创建点云材质
        var material = new THREE.PointsMaterial({ vertexColors: true, size: 0.1 })
        points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        // 创建点云对象
        var pointCloud = new THREE.Points(points.geometry, material)
        pointCloud.scale.set(0.102, 0.1, 0.055)
        pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
        pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
        pointCloud.position.set(60.7, -16.9, -9.5)
        // 将点云对象添加到场景中
        THIS.clearGltf(THIS.garbagePoolmodel)
        setTimeout(() => {
          THIS.modelScene.add(pointCloud)
          THIS.garbagePoolmodel = pointCloud
        }, 0)
      }, undefined, function(error) {
        console.error(error)
      })
    },
    handleShowTaskInfo(data) {
      const { craneNo, status } = data
      const index = this.craneList.findIndex((el) => el.key === craneNo)
      if (this.craneList[index].taskShow) {
        this.clearMesh(this.craneList[index].taskShow)
      }
      this.craneList[index].taskShow = new THREE.Mesh(new TextGeometry(this.taskFilter[status], {
        font: this.fontContent,
        size: 3,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
      this.craneList[index].taskShow.position.set(this.modelX - 6, 22, -17)
      this.modelScene.add(this.craneList[index].taskShow)
    },
    async handleUpdateAreaModel() {
      // const { success, data } = await findDeviceFaultList({
      //   pageNum: 1,
      //   pageSize: 50,
      //   notEnd: 1
      // })
      // let current = false
      // if (success) {
      //   current = data.list.some((el) => el.faultCode === '塌料告警')
      // }
      // if (current) {
      const pcdLoader = new PCDLoader()
      const THIS = this
      pcdLoader.load(`${this.BASE_URL}area.pcd`, function(points) {
        // 创建点云材质
        var material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 })
        // 创建点云对象
        var pointCloud = new THREE.Points(points.geometry, material)
        pointCloud.scale.set(0.102, 0.1, 0.055)
        pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
        pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
        pointCloud.position.set(60.7, -16.7, -9.5)
        // 将点云对象添加到场景中
        THIS.clearGltf(THIS.garbagePoolAreamodel)
        setTimeout(() => {
          THIS.modelScene.add(pointCloud)
          THIS.garbagePoolAreamodel = pointCloud
        }, 0)
      }, undefined, function(error) {
        console.error(error)
      })
      // }
    },
    handleGetAreaStock() {
      return new Promise((resolve, reject) => {
        findPartTrash({ url: 'http://172.168.10.102:8925/part_trash' })
          .then((res) => {
            this.areaStock = JSON.parse(res.data)
            resolve(res) // Resolve with the parsed data
          })
          .catch(error => {
            reject(error) // Reject with the error if there is any
          })
      })
    },
    handleGetAreaInfo() {
      return new Promise((resolve, reject) => {
        findParamSet().then((res) => {
          if (res.success) {
            res.data.ljc.map((ele) => {
              switch (ele.areaNo) {
                case 'area01':
                  this.areaInfo.area1 = parseFloat(ele.width)
                  break
                case 'area10':
                  this.areaInfo.area10 = parseFloat(ele.width)
                  break
                default:
                  break
              }
            })
            this.areaRace = res.data.ljc
          }
          // this.areaRace = (121.4 - this.areaInfo.area1 - this.areaInfo.area10) / 8

          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },
    handleGetTlkInfo() {
      return new Promise((resolve, reject) => {
        findPutMaterialPortList({
          pageNum: 1,
          pageSize: 10
        }).then((res) => {
          if (res.success) {
            this.inputList.forEach((el) => {
              res.data.list.map((ele) => {
                if (ele.materialPortNo === el.id) {
                  el.degreeLeft = ele.leftDegree.toFixed(0)
                  el.degreeRight = ele.rightDegree.toFixed(0)
                  el.materialPortThreshold = ele.materialPortThreshold
                }
              })
            })
          }
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },
    // handleGetCraneAutoStatus() {
    //   return new Promise((resolve, reject) => {
    //     selectAllCraneStatus().then((res) => {
    //       if (res.success) {
    //         this.craneAutoList.forEach((el) => {
    //           el.value = res.result[el.key] === '1' ? '自动' : '手动'
    //         })
    //       }
    //       resolve(res)
    //     }).catch(error => {
    //       reject(error)
    //     })
    //   })
    // },
    // 鼠标移动事件处理函数
    onDocumentMouseMove(event) {
      const dom = this.$refs.container
      // 获取鼠标相对于区域的坐标
      const containerRect = dom.getBoundingClientRect()
      const mouseX = event.clientX - containerRect.left
      const mouseY = event.clientY - containerRect.top

      // 将鼠标坐标转换为范围 [-1, 1]
      const mouse = new THREE.Vector2()
      mouse.x = (mouseX / dom.clientWidth) * 2 - 1
      mouse.y = -(mouseY / dom.clientHeight) * 2 + 1

      // 创建一个Raycaster对象，用于检测鼠标是否与模型相交
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, this.modelCamera) // 将光线从相机发射到鼠标位置

      // 检测与模型的相交情况 craneShow clawShow
      const intersects = raycaster.intersectObjects([
        this.craneList[0].craneShow,
        this.craneList[0].clawShow,
        this.craneList[1].craneShow,
        this.craneList[1].clawShow,
        this.craneList[2].craneShow,
        this.craneList[2].clawShow
      ], true)
      if (intersects.length > 0) {
        // 如果鼠标与模型相交，则显示弹框，并设置弹框的位置在鼠标附近
        intersects.map((el) => {
          if (['craneShow0', 'clawShow0'].includes(el.object.name)) {
            this.currentIndex = 0
          }
          if (['craneShow1', 'clawShow1'].includes(el.object.name)) {
            this.currentIndex = 1
          }
          if (['craneShow2', 'clawShow2'].includes(el.object.name)) {
            this.currentIndex = 2
          }
        })
        if (intersects.some((item) => ['craneShow0', 'craneShow1', 'craneShow2'].includes(item.object.name))) {
          this.$refs.tips1.style.display = 'block'
          this.$refs.tips1.style.transform = `translateX(${event.clientX + 10}px) translateY(${event.clientY + 10}px)`
          // 更新上一次显示弹框的时间
          this.lastPopupTime1 = Date.now()
        }
        if (intersects.some((item) => ['clawShow0', 'clawShow1', 'clawShow2'].includes(item.object.name))) {
          this.$refs.tips2.style.display = 'block'
          this.$refs.tips2.style.transform = `translateX(${event.clientX + 10}px) translateY(${event.clientY + 10}px)`
          // 更新上一次显示弹框的时间
          this.lastPopupTime2 = Date.now()
        }
      }
      // 如果距离上一次显示弹框的时间超过3秒，并且鼠标还在模型上，则继续显示弹框
      if (Date.now() - this.lastPopupTime1 < 3000) {
        this.$refs.tips1.style.display = 'block'
      } else {
        // 否则隐藏弹框
        this.$refs.tips1.style.display = 'none'
      }
      if (Date.now() - this.lastPopupTime2 < 3000) {
        this.$refs.tips2.style.display = 'block'
      } else {
        // 否则隐藏弹框
        this.$refs.tips2.style.display = 'none'
      }
    },
    onDocumentClick(event) {
      const dom = this.$refs.container

      // 获取鼠标相对于区域的坐标
      const containerRect = dom.getBoundingClientRect()
      const mouseX = event.clientX - containerRect.left
      const mouseY = event.clientY - containerRect.top

      // 将鼠标坐标转换为范围 [-1, 1]
      const mouse = new THREE.Vector2()
      mouse.x = (mouseX / dom.clientWidth) * 2 - 1
      mouse.y = -(mouseY / dom.clientHeight) * 2 + 1

      // 创建一个Raycaster对象，用于检测鼠标是否与模型相交
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, this.modelCamera) // 将光线从相机发射到鼠标位置

      // 检测与模型的相交情况 craneShow clawShow
      const intersects = raycaster.intersectObjects([
        this.craneList[0].craneShow,
        this.craneList[0].clawShow,
        this.craneList[1].craneShow,
        this.craneList[1].clawShow,
        this.craneList[2].craneShow,
        this.craneList[2].clawShow
      ], true)

      // 处理鼠标点击事件
      // console.log('----------', intersects)
      if (intersects.length > 0) {
        // 如果鼠标与模型相交，则执行点击事件的逻辑
        intersects.forEach((el) => {
          if (['craneShow0', 'clawShow0'].includes(el.object.name)) {
            // 处理与 craneShow0 和 clawShow0 相交的情况
            this.currentIndex = 0
            // 执行其他点击事件的逻辑，可以在这里添加
          }
          if (['craneShow1', 'clawShow1'].includes(el.object.name)) {
            // 处理与 craneShow1 和 clawShow1 相交的情况
            this.currentIndex = 1
            // 执行其他点击事件的逻辑，可以在这里添加
          }
          if (['craneShow2', 'clawShow2'].includes(el.object.name)) {
            // 处理与 craneShow2 和 clawShow2 相交的情况
            this.currentIndex = 2
            // 执行其他点击事件的逻辑，可以在这里添加
          }
          if (intersects.some((item) => ['craneShow0', 'craneShow1', 'craneShow2'].includes(item.object.name))) {
            this.$refs.tips1.style.display = 'block'
            this.$refs.tips1.style.transform = `translateX(${event.clientX + 10}px) translateY(${event.clientY + 10}px)`
          }
          if (intersects.some((item) => ['clawShow0', 'clawShow1', 'clawShow2'].includes(item.object.name))) {
            this.$refs.tips2.style.display = 'block'
            this.$refs.tips2.style.transform = `translateX(${event.clientX + 10}px) translateY(${event.clientY + 10}px)`
          }
        })
      } else {
        this.$refs.tips1.style.display = 'none'
        this.$refs.tips2.style.display = 'none'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.crane-tips {
  position: fixed;
  top: 0;
  left: 0;
  width: 220px;
  height: 210px;
  padding: 5px;
  background-color: rgba($color: #fff, $alpha: 0.9);
  color: #000;
  display: none;
  border-radius: 4px;
  z-index: 100;
  .tips-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 0;
    .xlm-span {
      text-align: center;
    }
  }
}
.test-xlm {
  position: absolute;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 50px;
  color: #fff;
  .xlm-item {
    border: 1px solid;
  }
}
</style>
