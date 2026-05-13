<template>
  <!-- <div style="width: 1866px; height: 100%; position: relative;"> -->
  <div style="width: 100%; height: 100%; position: absolute;">
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
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// 引入PCD加载器
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
// 字体要单独引入
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import * as TWEEN from '@tweenjs/tween.js'
import { findParamSet } from '@/api/setting'
import { findPartTrash, findPutMaterialPortList } from '@/api/pitArea'
import { disAreaInfo } from '@/api/pitArea'
import { filterDisArea } from '@/utils/filter'
// import ClawModel from '../../../public/static/Claw.glb'
// const ClawModel = new URL('../../../public/static/Claw.glb', import.meta.url)

/**
 * 三维建模(不包括大物平台)
 * 垃圾池(宽 正视的高 俯视的高): x 121.4, y 34(点云最高30米), z 26.4(不含投料口的6米)
 * 投料口: 16x6(中间3个间隔 - 17米)
 * 卸料门: 宽 3.8
 */
const MODELSET = {
  x: 137.4,
  y: 50,
  z: 32.4,
  tlkY: 44, // 投料口(墙壁)-高
  tlkZ: 6, // 投料口-宽
  tlkX: 16, // 投料口-长
  mask: 0, // 前面卸料门的遮挡 13
  xlmX: 3.8, // 卸料门-长
  xlmY: 7, // 卸料门-高
  wallX: 8 // 左右墙壁的宽
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
    xMin: -MODELSET.x / 2 + 3,
    xMax: MODELSET.x / 2 - 3
  },
  slider: {
    xMin: -MODELSET.x / 2 + 3,
    xMax: MODELSET.x / 2 - 3,
    zMin: -4,
    zMax: -33.5
  },
  claw: {
    xMin: -MODELSET.x / 2 + 3,
    xMax: MODELSET.x / 2 - 3,
    yMin: MODELSET.y / 2 - 3,
    yMax: -MODELSET.y / 2 + 3,
    zMin: MODELSET.z / 2 - 1,
    zMax: -(MODELSET.z / 2 - 1)
  },
  line: {
    xMin: -MODELSET.x / 2 + 3,
    xMax: MODELSET.x / 2 - 3,
    yMin: 0,
    yMax: MODELSET.y - 3,
    zMin: MODELSET.z / 2 - 1,
    zMax: -(MODELSET.z / 2 - 1)
  }
}

export default {
  inject: ['parent'],
  props: {
    currentLanguage: { // 语言切换
      type: Boolean,
      default: true
    }
  },
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
      modelScene: null, // 三维场景
      modelCamera: null,
      areaInfo: {
        area1: 10,
        area10: 10
      },
      areaList: [
        {
          text: '一区',
          enText: 'Zone 1',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '二区',
          enText: 'Zone 2',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '三区',
          enText: 'Zone 3',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '四区',
          enText: 'Zone 4',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '五区',
          enText: 'Zone 5',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '六区',
          enText: 'Zone 6',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '七区',
          enText: 'Zone 7',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '八区',
          enText: 'Zone 8',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '九区',
          enText: 'Zone 9',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        },
        {
          text: '十区',
          enText: 'Zone 10',
          textValue: null,
          textValue2: null,
          lineValue: null,
          stock: null,
          xValue: null,
          stock1: null,
          stock2: null,
          stock3: null
        }
      ],
      environment: process.env.NODE_ENV,
      areaStock: [],
      timer1: null,
      timer2: null,
      inputList: [
        {
          key: '一号炉',
          enKey: 'Stoker #1',
          value: null, // 投料口模型
          fontValue: null, // 编号
          fontValue2: null, // 编号
          id: 'materialPortNo01',
          degreeLeftValue: null,
          degreeRightValue: null,
          valueLeft: null,
          valueRight: null,
          degreeLeft: 0,
          degreeRight: 0, // 占比
          materialPortThreshold: 0, // 阈值
          furnaceInput: 0,
          inputValue: null, // 投炉
          inputValue2: null
        },
        {
          key: '二号炉',
          enKey: 'Stoker #2',
          value: null,
          fontValue: null,
          fontValue2: null,
          id: 'materialPortNo02',
          degreeLeftValue: null,
          degreeRightValue: null,
          valueLeft: null,
          valueRight: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0,
          furnaceInput: 0,
          inputValue: null,
          inputValue2: null
        },
        {
          key: '三号炉',
          enKey: 'Stoker #3',
          value: null,
          fontValue: null,
          fontValue2: null,
          id: 'materialPortNo03',
          degreeLeftValue: null,
          degreeRightValue: null,
          valueLeft: null,
          valueRight: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0,
          furnaceInput: 0,
          inputValue: null,
          inputValue2: null
        },
        {
          key: '四号炉',
          enKey: 'Stoker #4',
          value: null,
          fontValue: null,
          fontValue2: null,
          id: 'materialPortNo04',
          degreeLeftValue: null,
          degreeRightValue: null,
          valueLeft: null,
          valueRight: null,
          degreeLeft: 0,
          degreeRight: 0,
          materialPortThreshold: 0,
          furnaceInput: 0,
          inputValue: null,
          inputValue2: null
        }
      ],
      craneList: [
        {
          key: 'crane01',
          name: '一号车',
          enName: 'Crane #1',
          nameValue: null,
          nameValue2: null,
          trackLeft: null, // 左 大车
          trackRight: null, // 右 大车
          slider: null, // 小车
          claw1: null, // 垃圾爪
          claw2: null, // 垃圾爪
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
          clawCustomAnimate1: null, // 垃圾爪动画 - 控制模型移动
          clawCustomAnimate2: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          garbage: null, // 垃圾
          position: null,
          garbageCustomAnimate: null, // 垃圾动画
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null
        },
        {
          key: 'crane02',
          name: '二号车',
          enName: 'Crane #2',
          nameValue: null,
          nameValue2: null,
          trackLeft: null,
          trackRight: null,
          slider: null,
          claw1: null,
          claw2: null,
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
          clawCustomAnimate1: null, // 垃圾爪动画 - 控制模型移动
          clawCustomAnimate2: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          garbage: null,
          position: null,
          garbageCustomAnimate: null,
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null
        },
        {
          key: 'crane03',
          name: '三号车',
          enName: 'Crane #3',
          nameValue: null,
          nameValue2: null,
          trackLeft: null,
          trackRight: null,
          slider: null,
          claw1: null,
          claw2: null,
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
          clawCustomAnimate1: null, // 垃圾爪动画 - 控制模型移动
          clawCustomAnimate2: null, // 垃圾爪动画 - 控制模型移动
          lineCustomAnimate: null, // 垃圾爪连线动画
          clawAction: null, // 垃圾爪内置动画操作
          garbage: null,
          position: null,
          garbageCustomAnimate: null,
          mixer: null,
          trackLeftCustomGlintAnimate: null,
          trackRightCustomGlintAnimate: null
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
      areaRace: 0,
      areaInfoList: [],
      areaTotal: '0',
      isSart: false,
      positions: null,
      positions2: null,
      platform: null, // 参观平台-字
      platform2: null, // 参观平台-字 en
      textLength: null, // 长
      textLength2: null, // 长 en
      textWidth: null, // 宽
      textWidth2: null, // 宽 en
      textHeight: null, // 高
      textHeight2: null, // 高 en
      textPitArea: null, // 坑内分区
      textPitArea2: null, // 坑内分区 en
      textXlmNum: null, // 卸料门数量
      textXlmNum2: null // 卸料门数量 en
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
        })
      },
      deep: true
    }
  },
  async mounted() {
    const dom = this.$refs.container
    // 创建场景
    const scene = new THREE.Scene()
    this.modelScene = scene
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, dom.clientWidth / dom.clientHeight, 0.1, 1000)
    this.modelCamera = camera
    camera.position.z = 60
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(dom.clientWidth, dom.clientHeight)
    dom.appendChild(renderer.domElement)

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    // 设置控制器的初始位置
    controls.target.set(0, -5, 0)

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    // 设置曝光度
    renderer.toneMappingExposure = 1 // 适当调整曝光度
    // 光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)// 光源
    directionalLight.position.set(400, 200, 300)
    scene.add(directionalLight)

    // 创建背景材质
    // 透明
    const transparentMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 })
    // 带图背景
    const backgroundTexture = new THREE.TextureLoader().load('/static/bg_10.jpg') // bg_pit.jpg
    // backgroundTexture.repeat.set(0.5, 0.5)
    const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.DoubleSide })
    // 添加长方体到场景中
    const wallGeometryX = new THREE.BoxGeometry(MODELSET.x, MODELSET.y, 0.1)
    const wallGeometryZ = new THREE.BoxGeometry(MODELSET.x, 0.1, MODELSET.z)
    const wallGeometryY = new THREE.BoxGeometry(0.1, MODELSET.y, MODELSET.z)
    const wallX1 = new THREE.Mesh(wallGeometryX, backgroundMaterial)
    wallX1.position.set(0, 0, -MODELSET.z / 2)
    const wallX2 = new THREE.Mesh(wallGeometryZ, backgroundMaterial)
    wallX2.position.set(0, -MODELSET.y / 2, 0)
    const wallX3 = new THREE.Mesh(wallGeometryY, backgroundMaterial)
    wallX3.position.set(-MODELSET.x / 2, 0, 0)
    const wallX4 = new THREE.Mesh(wallGeometryY, backgroundMaterial)
    wallX4.position.set(MODELSET.x / 2, 0, 0)
    scene.add(wallX1, wallX2, wallX3, wallX4)

    // 添加投料口区域的墙壁
    const inputWallGeometry = new THREE.BoxGeometry(MODELSET.x - MODELSET.wallX * 2 - 0.2, MODELSET.tlkY - 0.1, 0.1)
    const inputWallGeometry1 = new THREE.BoxGeometry(3.2, 0.1, MODELSET.tlkZ - 0.1)
    const inputWallGeometry2 = new THREE.BoxGeometry(17, 0.1, MODELSET.tlkZ - 0.1)
    const inputWall = new THREE.Mesh(inputWallGeometry, backgroundMaterial)
    inputWall.position.set(0, -(MODELSET.y - MODELSET.tlkY) / 2, -MODELSET.z / 2 + MODELSET.tlkZ - 0.1)
    const inputWall1 = new THREE.Mesh(inputWallGeometry1, backgroundMaterial)
    const inputWall2 = new THREE.Mesh(inputWallGeometry1, backgroundMaterial)
    inputWall1.position.set(-MODELSET.x / 2 + MODELSET.wallX + 1.6, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z - MODELSET.tlkZ) / 2)
    inputWall2.position.set(MODELSET.x / 2 - MODELSET.wallX - 1.6, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z - MODELSET.tlkZ) / 2)
    const inputWall3 = new THREE.Mesh(inputWallGeometry2, backgroundMaterial)
    const inputWall4 = new THREE.Mesh(inputWallGeometry2, backgroundMaterial)
    const inputWall5 = new THREE.Mesh(inputWallGeometry2, backgroundMaterial)
    inputWall3.position.set(-MODELSET.x / 2 + MODELSET.wallX + 3.2 + 16 + 8.5, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z - MODELSET.tlkZ) / 2)
    inputWall4.position.set(-MODELSET.x / 2 + MODELSET.wallX + 3.2 + (16 + 8.5) * 2 + 8.5, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z - MODELSET.tlkZ) / 2)
    inputWall5.position.set(-MODELSET.x / 2 + MODELSET.wallX + 3.2 + (16 + 17) * 3 - 8.5, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z - MODELSET.tlkZ) / 2)
    scene.add(inputWall, inputWall1, inputWall2, inputWall3, inputWall4, inputWall5)
    // 添加投料口
    // const inputGeometry = new THREE.BoxGeometry(MODELSET.tlkX, 0.5, MODELSET.tlkZ + 5)
    const inputGeometry = new THREE.BoxGeometry(MODELSET.tlkX, 0.5, MODELSET.tlkZ)
    // const inputGeometryLeft = new THREE.BoxGeometry(MODELSET.tlkX / 2, 0.5, MODELSET.tlkZ - 0.2)
    const inputGeometryMove = new THREE.BoxGeometry(MODELSET.tlkX, 0.5, MODELSET.tlkZ)
    inputGeometryMove.translate(0, 0, -MODELSET.tlkZ / 2)
    this.inputList.forEach((el, index, arr) => {
      el.value = new THREE.Mesh(inputGeometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }))
      // el.value.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 3.5, -(MODELSET.z - MODELSET.tlkZ) / 2)
      el.value.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) + 1.5, -(MODELSET.z - MODELSET.tlkZ) / 2)
      el.value.rotation.x = THREE.MathUtils.degToRad(30)
      el.valueLeft = new THREE.Mesh(inputGeometryMove, new THREE.MeshBasicMaterial({ color: 0xff0000 })) // MODELSET.tlkX / 4
      el.valueLeft.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY), -MODELSET.z / 2 + MODELSET.tlkZ)
      el.valueLeft.rotation.x = THREE.MathUtils.degToRad(30)
      // el.valueRight = new THREE.Mesh(inputGeometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }))
      // el.valueRight.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 3.5, -(MODELSET.z - MODELSET.tlkZ) / 2)
      // el.valueRight.rotation.x = THREE.MathUtils.degToRad(-60)
      scene.add(el.value, el.valueLeft)
    })

    // 添加左右区域的墙壁
    const wallGeometry = new THREE.BoxGeometry(MODELSET.wallX, MODELSET.tlkY - 0.1, MODELSET.z - 0.1)
    const wallLeft = new THREE.Mesh(wallGeometry, backgroundMaterial)
    wallLeft.position.set(-(MODELSET.x / 2 - MODELSET.wallX / 2), -(MODELSET.y - MODELSET.tlkY) / 2, 0)
    const wallRight = new THREE.Mesh(wallGeometry, backgroundMaterial)
    wallRight.position.set(MODELSET.x / 2 - MODELSET.wallX / 2, -(MODELSET.y - MODELSET.tlkY) / 2, 0)
    scene.add(wallLeft, wallRight)

    // 添加前面的黑色区域
    const frontBackgroundGeometry = new THREE.PlaneGeometry(MODELSET.x, MODELSET.mask, 1, 1)
    const frontBackgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    const backgroundPlane = new THREE.Mesh(frontBackgroundGeometry, frontBackgroundMaterial)
    backgroundPlane.position.set(0, -(MODELSET.y - MODELSET.mask) / 2, MODELSET.z / 2)
    // 添加背景平面到场景中
    // scene.add(backgroundPlane)

    // 添加前面顶部的线
    const frontLineGeometry = new THREE.BoxGeometry(MODELSET.x, 0.1, 0.1)
    const frontLine = new THREE.Mesh(frontLineGeometry, frontBackgroundMaterial)
    frontLine.position.set(0, MODELSET.y / 2 - 0.1, MODELSET.z / 2 - 0.1)
    scene.add(frontLine)

    // 垃圾池长度线
    // const xLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    // const xLineGeometry = new THREE.BoxGeometry(0.1, 6, 0.1)
    // const yLineGeometry = new THREE.BoxGeometry(0.1, 0.1, MODELSET.z)
    // const xLine = new THREE.Mesh(frontLineGeometry, xLineMaterial)
    // const yLine = new THREE.Mesh(yLineGeometry, xLineMaterial)
    // const xLineLeft = new THREE.Mesh(xLineGeometry, xLineMaterial)
    // const xLineRight = new THREE.Mesh(xLineGeometry, xLineMaterial)
    // const xLineFront = new THREE.Mesh(xLineGeometry, xLineMaterial)
    // xLine.position.set(0, MODELSET.y / 2 - 0.1 + 3, -MODELSET.z / 2 - 0.1)
    // yLine.position.set(-MODELSET.x / 2, MODELSET.y / 2 - 0.1 + 3, 0)
    // xLineLeft.position.set(-MODELSET.x / 2, MODELSET.y / 2 - 0.1 + 3, -MODELSET.z / 2 - 0.1)
    // xLineRight.position.set(MODELSET.x / 2, MODELSET.y / 2 - 0.1 + 3, -MODELSET.z / 2 - 0.1)
    // xLineFront.position.set(-MODELSET.x / 2, MODELSET.y / 2 - 0.1 + 3, MODELSET.z / 2 - 0.1)
    // scene.add(xLine, xLineLeft, xLineRight, xLineFront, yLine)
    // const xLineGeometry = new THREE.BoxGeometry(0.1, 6, 0.1)
    // const yLineGeometry = new THREE.BoxGeometry(0.1, 0.1, MODELSET.z)
    // const zLineGeometry = new THREE.BoxGeometry(0.1, 0.1, MODELSET.z)

    // 左侧观察室
    const roomGeometry1 = new THREE.BoxGeometry(MODELSET.wallX, 0.1, 0.1)
    const roomGeometry2 = new THREE.BoxGeometry(0.1, MODELSET.y - MODELSET.tlkY, 0.1)
    const roomGeometry5 = new THREE.BoxGeometry(0.1, 0.1, 16)
    const roomLine1 = new THREE.Mesh(roomGeometry1, frontBackgroundMaterial)
    const roomLine2 = new THREE.Mesh(roomGeometry1, frontBackgroundMaterial)
    const roomLine3 = new THREE.Mesh(roomGeometry2, frontBackgroundMaterial)
    const roomLine4 = new THREE.Mesh(roomGeometry2, frontBackgroundMaterial)
    const roomLine5 = new THREE.Mesh(roomGeometry5, frontBackgroundMaterial)
    const roomLine6 = new THREE.Mesh(roomGeometry2, frontBackgroundMaterial)
    const roomLine7 = new THREE.Mesh(roomGeometry2, frontBackgroundMaterial)
    roomLine1.position.set(-MODELSET.x / 2 + MODELSET.wallX / 2, MODELSET.y / 2, 8)
    roomLine2.position.set(-MODELSET.x / 2 + MODELSET.wallX / 2, MODELSET.y / 2, -8)
    roomLine3.position.set(-MODELSET.x / 2 + MODELSET.wallX, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) / 2, 8)
    roomLine4.position.set(-MODELSET.x / 2 + MODELSET.wallX, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) / 2, -8)
    roomLine5.position.set(-MODELSET.x / 2 + MODELSET.wallX, MODELSET.y / 2, 0)
    roomLine6.position.set(-MODELSET.x / 2 + 0.1, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) / 2, 8)
    roomLine7.position.set(-MODELSET.x / 2 + 0.1, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) / 2, -8)
    scene.add(roomLine1, roomLine2, roomLine3, roomLine4, roomLine5, roomLine6, roomLine7)

    const coneGeometry = new THREE.ConeGeometry(1, 4)
    const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const cone = new THREE.Mesh(coneGeometry, coneMaterial)
    cone.rotation.x = THREE.MathUtils.degToRad(180)
    cone.position.set(-MODELSET.x / 2 + 4, MODELSET.y / 2 + 2, 0)
    scene.add(cone)

    const loader = new GLTFLoader()
    loader.load('/static/people.glb', (gltf) => {
      gltf.scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          // 应用材质到每个网格
          child.material = frontBackgroundMaterial
        }
      })
      gltf.scene.position.set(-MODELSET.x / 2, MODELSET.y / 2 - 6, 0)
      gltf.scene.rotation.y = 10
      gltf.scene.scale.set(0.05, 0.05, 0.05)
      scene.add(gltf.scene)
    }, undefined, function(error) {
      console.error(error)
    })
    loader.load('/static/wall.glb', (gltf) => {
      gltf.scene.position.set(-MODELSET.x / 2 + 4, MODELSET.y / 2 - 6, 2)
      gltf.scene.scale.set(6.5, 13, 10)
      scene.add(gltf.scene)
    }, undefined, function(error) {
      console.error(error)
    })
    loader.load('/static/wall.glb', (gltf) => {
      gltf.scene.position.set(-MODELSET.x / 2 + 2, MODELSET.y / 2 - 6, 0)
      gltf.scene.rotation.y = THREE.MathUtils.degToRad(90)
      gltf.scene.scale.set(13.5, 13, 10)
      scene.add(gltf.scene)
    }, undefined, function(error) {
      console.error(error)
    })
    loader.load('/static/wall.glb', (gltf) => {
      gltf.scene.position.set(-MODELSET.x / 2 + 8, MODELSET.y / 2 - 6, 0)
      gltf.scene.rotation.x = THREE.MathUtils.degToRad(-90)
      gltf.scene.rotation.z = THREE.MathUtils.degToRad(90)
      gltf.scene.scale.set(13.5, 17.5, 10)
      scene.add(gltf.scene)
    }, undefined, function(error) {
      console.error(error)
    })

    // 坐标
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const arrowGeometryX = new THREE.BoxGeometry(MODELSET.x + 4, 0.5, 0.5)
    const arrowX = new THREE.Mesh(arrowGeometryX, arrowMaterial)
    arrowX.position.set(0, MODELSET.y / 2 + 2, MODELSET.z / 2)
    const arrowGeometryY = new THREE.BoxGeometry(0.5, 0.5, MODELSET.z)
    const arrowY = new THREE.Mesh(arrowGeometryY, arrowMaterial)
    arrowY.position.set(-MODELSET.x / 2 - 2, MODELSET.y / 2 + 2, 0)
    const arrowGeometryZ = new THREE.BoxGeometry(0.5, MODELSET.y + 4, 0.5)
    const arrowZ = new THREE.Mesh(arrowGeometryZ, arrowMaterial)
    arrowZ.position.set(-MODELSET.x / 2 - 2, 0, MODELSET.z / 2)

    scene.add(arrowX, arrowY, arrowZ)

    // 添加前面垃圾车的平台
    // const platformGeometry = new THREE.BoxGeometry(121.4, 1, 15)
    // const platform = new THREE.Mesh(platformGeometry, frontBackgroundMaterial)
    // platform.position.set(0, -3.5, 23.7)
    // scene.add(platform)

    // 卸料门
    // const dischargeGeometry = new THREE.BoxGeometry(MODELSET.xlmX, MODELSET.xlmY, 1)
    const dischargeGeometry1 = new THREE.BoxGeometry(MODELSET.xlmX, 0.2, 1)
    const dischargeGeometry2 = new THREE.BoxGeometry(0.2, MODELSET.xlmY + 0.2, 1)
    // const dischargeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide })
    const rangingTexture = new THREE.TextureLoader().load('/static/bg_pit.jpg')
    const dischargeMaterial = new THREE.MeshBasicMaterial({ map: rangingTexture })
    this.dischargeList.forEach((door, index, arr) => {
      door.value = [
        new THREE.Mesh(dischargeGeometry1, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry1, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry2, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry2, dischargeMaterial)
      ]
      door.value[0].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX / 2), -((MODELSET.y / 2) - MODELSET.mask) + 0.1, MODELSET.z / 2)
      door.value[1].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX / 2), -((MODELSET.y / 2) - MODELSET.mask - MODELSET.xlmY) + 0.1, MODELSET.z / 2)
      door.value[2].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6), -((MODELSET.y / 2) - MODELSET.mask - MODELSET.xlmY / 2) + 0.1, MODELSET.z / 2)
      door.value[3].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX), -((MODELSET.y / 2) - MODELSET.mask - MODELSET.xlmY / 2) + 0.1, MODELSET.z / 2)
      scene.add(door.value[0], door.value[1], door.value[2], door.value[3])
    })

    // 添加连接垃圾爪的线
    const clawMaterial = new THREE.MeshBasicMaterial({ color: 0x5F473B })
    const lineGeometry = new THREE.BoxGeometry(0.2, 1, 0.2)
    lineGeometry.translate(0, -0.5, 0) // 平移几何体的顶点

    // 行车信息展示的触发模型
    // const transparentGeometryCrane = new THREE.BoxGeometry(3, 1, MODELSET.z)
    // const transparentGeometryClaw = new THREE.BoxGeometry(3, 5, 1)

    this.craneList.forEach((el, index) => {
      // 大车
      loader.load('/static/crane.glb', (gltf) => {
        gltf.scene.position.set(-MODELSET.x / 2 + 3, MODELSET.y / 2, -16)
        gltf.scene.rotation.y = THREE.MathUtils.degToRad(90)
        gltf.scene.scale.set(2, 2, 2)
        el.trackLeft = gltf.scene
        scene.add(el.trackLeft)
        el.trackLeft.name = 'trackLeft' + index
        el.trackLeftCustomAnimate = new TWEEN.Tween(el.trackLeft.position).dynamic(true)
      }, undefined, function(error) {
        console.error(error)
      })
      // 小车
      loader.load('/static/smallCar.glb', (gltf) => {
        gltf.scene.position.set(-MODELSET.x / 2 + 3, MODELSET.y / 2, -33.5)
        gltf.scene.rotation.y = THREE.MathUtils.degToRad(90)
        gltf.scene.scale.set(2, 2, 2)
        el.slider = gltf.scene
        scene.add(el.slider)
        el.slider.name = 'slider' + index
        el.sliderCustomAnimate = new TWEEN.Tween(el.slider.position).dynamic(true)
      }, undefined, function(error) {
        console.error(error)
      })
      // 连接垃圾爪的线
      el.line = new THREE.Mesh(lineGeometry, clawMaterial)
      el.line.position.set(index * 20 - MODELSET.y / 2, MODELSET.y / 2, MODELSET.z / 2 - 0.5)
      scene.add(el.line)
      el.line.name = 'line' + index
      el.lineCustomAnimate = new TWEEN.Tween({ position: el.line.position, length: el.line.scale }).dynamic(true)
      // 行车信息展示的触发模型 craneShow clawShow
      // el.craneShow = new THREE.Mesh(transparentGeometryCrane, transparentMaterial)
      // el.craneShow.position.set(index * 20 - MODELSET.y / 2, MODELSET.y / 2 + 0.5, 0)
      // el.craneShow.name = 'craneShow' + index
      // el.clawShow = new THREE.Mesh(transparentGeometryClaw, transparentMaterial)
      // el.clawShow.position.set(index * 20 - MODELSET.y / 2, MODELSET.y / 2 - 5 / 2, MODELSET.z / 2 + 0.5)
      // el.clawShow.name = 'clawShow' + index
      // scene.add(el.craneShow, el.clawShow)
      // 垃圾爪
      loader.load('/static/claw_open.glb', (gltf) => {
        el.claw1 = gltf.scene
        el.claw1.position.set(10 * index, CRANERACE.claw.yMin, CRANERACE.claw.zMin)
        el.claw1.scale.set(4, 4, 4)
        // scene.add(el.claw1)

        // // 自定义动画
        el.clawCustomAnimate1 = new TWEEN.Tween(el.claw1.position)
          .dynamic(true) // 动态更新
      }, undefined, function(error) {
        console.error(error)
      })
      loader.load('/static/claw_close.glb', (gltf) => {
        el.claw2 = gltf.scene
        el.claw2.position.set(10 * index, CRANERACE.claw.yMin, CRANERACE.claw.zMin)
        el.claw2.scale.set(4, 4, 4)
        scene.add(el.claw2)

        // // 自定义动画
        el.clawCustomAnimate2 = new TWEEN.Tween(el.claw2.position)
          .dynamic(true) // 动态更新
      }, undefined, function(error) {
        console.error(error)
      })
      // 垃圾爪上的垃圾
      loader.load('/static/garbage.glb', (gltf) => {
        el.garbage = gltf.scene
        // el.garbage.position.set(10 * index, CRANERACE.claw.yMin - 3, CRANERACE.claw.zMin)
        // el.garbage.scale.set(0.2, 0.13, 0.13)
        el.garbage.position.set(10 * index, CRANERACE.claw.yMin - 5, CRANERACE.claw.zMin)
        el.garbage.scale.set(0.6, 0.6, 0.6)
        scene.add(el.garbage)

        // // 自定义动画
        el.garbageCustomAnimate = new TWEEN.Tween(el.garbage.position)
          .dynamic(true) // 动态更新
      }, undefined, function(error) {
        console.error(error)
      })
    })

    // 添加垃圾爪
    const that = this

    // 箭头
    // this.arrowMaterialGreen = new THREE.MeshBasicMaterial({ color: 0x2ec64f })
    // this.arrowMaterialRed = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    // this.limitGeometry = new THREE.BoxGeometry(2.5, 0.6, 1)

    // 添加垃圾坑模型
    const pcdLoader = new PCDLoader() // lvbo.pcd
    pcdLoader.load(`${this.BASE_URL}add.pcd`, function(points) {
    // pcdLoader.load(`/static/add.pcd`, function(points) {
      // 获取点云数据
      // var positions = points.geometry.attributes.position.array
      // var colors = []
      // for (var i = 0; i < positions.length; i += 3) {
      //   var x = positions[i]
      //   // rgb(45, 45, 150) --  rgb(146, 146, 157)
      //   var r = 45 + Math.round(Math.random() * 80) // 四舍五入
      //   var g = 45 + Math.round(Math.random() * 80) // 四舍五入
      //   var b = 150 + Math.round(Math.random() * 7) // 四舍五入
      //   var strColor = 'rgb(' + r + ', ' + g + ', ' + b + ')'
      //   const colorList = [
      //     'rgb(0, 0, 0)',
      //     'rgb(28, 28, 28)',
      //     'rgb(54, 54, 54)'
      //   ]
      //   var color = new THREE.Color(colorList[Math.round(Math.random() * 3)])

      //   colors.push(color.r, color.g, color.b)
      // }
      // points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3, false))
      // // 获取点云数据
      var positions = points.geometry.attributes.position.array
      var colors = []
      // 根据高度设置颜色
      var minHeight = 0 // 设置最小高度
      var maxHeight = 400 // 设置最大高度
      for (var i = 0; i < positions.length; i += 3) {
        // var x = positions[i]
        // var y = positions[i + 1];
        var z = positions[i + 2]
        var normalizedHeight = (z - minHeight) / (maxHeight - minHeight) // 将高度归一化到 [0, 1] 范围
        // 根据归一化高度值计算颜色
        var color = new THREE.Color()
        color.setHSL(normalizedHeight, 1, 0.2) // 使用HSL颜色空间来设置颜色 0.5
        colors.push(color.r, color.g, color.b)
      }
      // // 创建点云材质
      var material = new THREE.PointsMaterial({ vertexColors: true, size: 1 })
      // // var material = new THREE.PointsMaterial({ color: 0x495361, size: 0.2 })
      points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      // 创建点云对象
      var pointCloud = new THREE.Points(points.geometry, material)
      pointCloud.scale.set(0.1, 0.1, 0.075)
      pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
      pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
      pointCloud.position.set((MODELSET.x - MODELSET.wallX * 2) / 2, -MODELSET.y / 2 + 0.1, -MODELSET.z / 4 - 3)
      // 将点云对象添加到场景中
      scene.add(pointCloud)
      that.garbagePoolmodel = pointCloud
    }, undefined, function(error) {
      console.error(error)
    })

    // 卸料门状态
    const circleGeometry = new THREE.SphereGeometry(0.7)
    this.dischargeList.forEach((el, index, arr) => {
      el.statusValue = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true }))
      el.statusValue.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX / 2), MODELSET.mask + MODELSET.xlmY - MODELSET.y / 2, MODELSET.z / 2)
      scene.add(el.statusValue)
      el.statusAnimate = new TWEEN.Tween(el.statusValue.material).dynamic(true)
      // 垃圾车
      // loader.load('/static/garbage_truck.glb', (gltf) => {
      //   gltf.scene.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index + 2 - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX / 2), -MODELSET.y / 2, MODELSET.z / 2)
      //   // gltf.scene.rotation.x = THREE.MathUtils.degToRad(90)
      //   // gltf.scene.rotation.z = THREE.MathUtils.degToRad(90)
      //   gltf.scene.rotation.y = THREE.MathUtils.degToRad(-30)
      //   // gltf.scene.scale.set(0.001, 0.001, 0.001)
      //   scene.add(gltf.scene)
      // }, undefined, function(error) {
      //   console.error(error)
      // })
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
    // dom.addEventListener('click', this.onDocumentClick)

    fontPromise.then(() => {
      const x = new THREE.Mesh(new TextGeometry('X', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      x.position.set(-1.8, MODELSET.y / 2 + 3, MODELSET.z / 2)
      const y = new THREE.Mesh(new TextGeometry('Y', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      y.position.set(-MODELSET.x / 2 - 3.8, MODELSET.y / 2 + 3, 0)
      const z = new THREE.Mesh(new TextGeometry('Z', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      z.position.set(-MODELSET.x / 2 - 5, 0, MODELSET.z / 2 + 0.1)

      this.platform = new THREE.Mesh(new TextGeometry('参观平台', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      this.platform.position.set(-MODELSET.x / 2 + 0.1, MODELSET.y / 2 - 2.5, 5)
      this.platform.rotation.y = THREE.MathUtils.degToRad(90)
      this.platform2 = new THREE.Mesh(new TextGeometry('Visiting Platform', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      this.platform2.position.set(-MODELSET.x / 2 + 0.1, MODELSET.y / 2 - 4, 5)
      this.platform2.rotation.y = THREE.MathUtils.degToRad(90)
      // 标语
      // const text1 = new THREE.Mesh(new TextGeometry('坚持 坚韧', {
      //   font: this.fontContent,
      //   size: 4.5,
      //   height: 0
      // }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      // const text3 = new THREE.Mesh(new TextGeometry('专业 专注', {
      //   font: this.fontContent,
      //   size: 4.5,
      //   height: 0
      // }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      // text1.rotation.y = THREE.MathUtils.degToRad(90)
      // text3.rotation.y = THREE.MathUtils.degToRad(90)
      // text1.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 12, 16)
      // text3.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 4, 16)
      this.textPitArea = new THREE.Mesh(new TextGeometry('坑内分区:10区', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textPitArea.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textPitArea.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 16, -6)
      this.textPitArea2 = new THREE.Mesh(new TextGeometry('Zone 10 within the Pit', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textPitArea2.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textPitArea2.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 14.5, -5)

      this.textXlmNum = new THREE.Mesh(new TextGeometry('卸料门数量:16个', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textXlmNum.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textXlmNum.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 12, -7)
      this.textXlmNum2 = new THREE.Mesh(new TextGeometry('Discharge Gates: 16', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textXlmNum2.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textXlmNum2.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 10.5, -4)

      const xArrow = new THREE.Mesh(new TextGeometry('>', {
        font: this.fontContent,
        size: 4,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      xArrow.position.set(MODELSET.x / 2, MODELSET.y / 2 + 0.1, MODELSET.z / 2)
      const yArrow = new THREE.Mesh(new TextGeometry('>', {
        font: this.fontContent,
        size: 4,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      yArrow.rotation.y = THREE.MathUtils.degToRad(90)
      yArrow.position.set(-MODELSET.x / 2 - 2, MODELSET.y / 2 + 0.2, -MODELSET.z / 2 + 1.5)
      const zArrow = new THREE.Mesh(new TextGeometry('>', {
        font: this.fontContent,
        size: 4,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      zArrow.rotation.z = THREE.MathUtils.degToRad(-90)
      zArrow.position.set(-MODELSET.x / 2 - 3.8, -MODELSET.y / 2, MODELSET.z / 2)

      scene.add(this.platform, this.platform2, this.textPitArea, this.textPitArea2, this.textXlmNum, this.textXlmNum2, xArrow, yArrow, zArrow, x, y, z)

      return this.handleGetAreaInfo()
    }).then(() => {
      // 分区
      this.areaList.forEach((el, index) => {
        // 线
        el.lineValue = new THREE.Mesh(areaLineGeometry, areaLineMaterial)
        scene.add(el.lineValue)
        if (index === 0) {
          el.lineValue.position.set(this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 2, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else if (index === 9) {
          el.lineValue.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - this.areaInfo.area10, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 2, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else {
          el.lineValue.position.set(this.areaRace * index + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 2, -(MODELSET.z / 2 - MODELSET.tlkZ))
        }
        // 编号
        el.textValue = new THREE.Mesh(new TextGeometry(el.text, {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        el.textValue2 = new THREE.Mesh(new TextGeometry(el.enText, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        scene.add(el.textValue, el.textValue2)
        if (index === 0) {
          el.textValue.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - 2.5, MODELSET.y / 2 - 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.textValue2.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - 2.5, MODELSET.y / 2 - 3.5 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else if (index === 9) {
          el.textValue.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - 2.5, MODELSET.y / 2 - 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.textValue2.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - 2.5, MODELSET.y / 2 - 3.5 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
          // const xText = (121.4 - this.areaInfo.area10).toString()
          // el.xValue = new THREE.Mesh(new TextGeometry(xText, {
          //   font: this.fontContent,
          //   size: 1.5,
          //   height: 0
          // }), new THREE.MeshBasicMaterial({ color: 0x0000FF }))
          // scene.add(el.xValue)
          // el.xValue.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - this.areaInfo.area10 - 2, MODELSET.y / 2 - 5.5 - (MODELSET.y - MODELSET.tlkY), -10)
        } else {
          el.textValue.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - 2.5, MODELSET.y / 2 - 2 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.textValue2.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - 2.5, MODELSET.y / 2 - 3.5 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
          // const xText = (this.areaInfo.area1 + this.areaRace * (index - 1)).toString()
          // el.xValue = new THREE.Mesh(new TextGeometry(xText, {
          //   font: this.fontContent,
          //   size: 1.5,
          //   height: 0
          // }), new THREE.MeshBasicMaterial({ color: 0x0000FF }))
          // scene.add(el.xValue)
          // el.xValue.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 - 2, MODELSET.y / 2 - 5.5 - (MODELSET.y - MODELSET.tlkY), -9.5)
        }
      })
    }).finally(() => {
      return this.handleGetTlkInfo()
    }).then(() => {
      this.inputList.forEach((el, index, arr) => {
        const num = (Number(el.degreeLeft) + Number(el.degreeRight)) / 2
        // 投料口占比
        const degreeColor1 = (num > el.materialPortThreshold) ? 0x00b050 : 0xff0000
        el.valueLeft.material.color.set(degreeColor1)
        el.valueLeft.scale.set(1, 1, num / 100)

        el.inputValue = new THREE.Mesh(new TextGeometry('投炉' + el.furnaceInput + '吨', {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xF25D22 }))
        el.inputValue.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2) - 0, MODELSET.y / 2 - 1.2, -MODELSET.z / 2 + 0.1)
        el.inputValue2 = new THREE.Mesh(new TextGeometry('Charging ' + el.furnaceInput + 't', {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xF25D22 }))
        el.inputValue2.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2) - 1.8, MODELSET.y / 2 - 2.5, -MODELSET.z / 2 + 0.1)
        scene.add(el.inputValue, el.inputValue2)
      })
    }).finally(() => {
      // 投料口编号
      this.inputList.forEach((el, index, arr) => {
        el.fontValue = new THREE.Mesh(new TextGeometry(el.key, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))// 52
        el.fontValue.position.set((MODELSET.tlkX + 17) * index - 4.5 - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - 1.2, -MODELSET.z / 2 + 0.1)
        el.fontValue2 = new THREE.Mesh(new TextGeometry(el.enKey, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))// 52
        el.fontValue2.position.set((MODELSET.tlkX + 17) * index - 8.2 - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - 2.5, -MODELSET.z / 2 + 0.1)
        scene.add(el.fontValue, el.fontValue2)
      })
      return this.handleGetDisAreaInfo()
    }).then(() => {
      // 分区
      this.areaList.forEach((el, index) => {
        // 分区信息
        const text = (this.areaInfoList[index].areaStatus === 'FJ') ? this.areaInfoList[index].fermentationTime + '天' : ''
        const text2 = (this.areaInfoList[index].areaStatus === 'FJ') ? this.areaInfoList[index].fermentationTime + ' days' : ''
        const ance = 3.5
        const ance2 = 2
        // const ance3 = 2
        const ance4 = 2.5
        const filterAnce = this.filterEnDisArea(this.areaInfoList[index].areaStatus)
        el.stock = new THREE.Mesh(new TextGeometry(this.filterDisArea(this.areaInfoList[index].areaStatus), {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        el.stock1 = new THREE.Mesh(new TextGeometry(text, {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        el.stock2 = new THREE.Mesh(new TextGeometry(filterAnce.str, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        el.stock3 = new THREE.Mesh(new TextGeometry(text2, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        scene.add(el.stock, el.stock1, el.stock2, el.stock3)
        if (index === 0) {
          el.stock.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

          el.stock2.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock3.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else if (index === 9) {
          el.stock.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

          el.stock2.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock3.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else {
          el.stock.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

          el.stock2.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock3.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
        }
      })
      return this.handleGetAreaStock()
      // return this.handleGetDisAreaInfo()
    }).then(() => {
      // this.positions = new THREE.Mesh(new TextGeometry('  容积:57000立方  当前库存:' + text, {
      //   font: this.fontContent,
      //   size: 3,
      //   height: 0
      // }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      // this.positions.position.set(-58, 8, -(MODELSET.z / 2 - MODELSET.tlkZ))

      this.textLength = new THREE.Mesh(new TextGeometry('长:121.4米', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textLength2 = new THREE.Mesh(new TextGeometry('Length:121.4m', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textWidth = new THREE.Mesh(new TextGeometry('宽:26.4米', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textWidth2 = new THREE.Mesh(new TextGeometry('Width:26.4m', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textHeight = new THREE.Mesh(new TextGeometry('高:23米', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textHeight2 = new THREE.Mesh(new TextGeometry('Height:23m', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textLength.rotation.y = THREE.MathUtils.degToRad(90)
      this.textWidth.rotation.y = THREE.MathUtils.degToRad(90)
      this.textHeight.rotation.y = THREE.MathUtils.degToRad(90)
      this.textLength2.rotation.y = THREE.MathUtils.degToRad(90)
      this.textWidth2.rotation.y = THREE.MathUtils.degToRad(90)
      this.textHeight2.rotation.y = THREE.MathUtils.degToRad(90)
      this.textLength.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 16, 11)
      this.textWidth.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 12, 10)
      this.textHeight.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 8, 9)
      this.textLength2.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 14.5, 9)
      this.textWidth2.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 10.5, 8)
      this.textHeight2.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 6.5, 8)

      const text = (this.areaTotal.slice(0, 5) * 0.45).toFixed(0)
      this.positions = new THREE.Mesh(new TextGeometry('当前库存:' + text + '吨', {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.positions.rotation.y = THREE.MathUtils.degToRad(-90)
      this.positions.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 8, -8)
      this.positions2 = new THREE.Mesh(new TextGeometry('Current Inventory:' + text + 't', {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.positions2.rotation.y = THREE.MathUtils.degToRad(-90)
      this.positions2.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 6.5, -5)

      scene.add(this.textLength, this.textWidth, this.textHeight, this.textLength2, this.textWidth2, this.textHeight2, this.positions, this.positions2)
    }).finally(() => {
      // 卸料门的编号
      this.dischargeList.forEach((el, index, arr) => {
        el.fontValue = new THREE.Mesh(new TextGeometry(el.key, {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.fontValue.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.wallX * 2 - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - 1.5 - ((MODELSET.x - MODELSET.wallX * 2) / 2 - 7.6 - MODELSET.xlmX / 2), MODELSET.mask + MODELSET.xlmY - MODELSET.y / 2 + 1, MODELSET.z / 2)
        scene.add(el.fontValue)
      })
      // 行车号
      this.craneList.forEach((el, index, arr) => {
        el.nameValue = new THREE.Mesh(new TextGeometry(el.name, {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.nameValue.position.set(0, MODELSET.y / 2 - 3, MODELSET.z / 2 + 0.5)
        el.nameValue2 = new THREE.Mesh(new TextGeometry(el.enName, {
          font: this.fontContent,
          size: 1,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.nameValue2.position.set(0, MODELSET.y / 2 - 4.5, MODELSET.z / 2 + 0.5)
        scene.add(el.nameValue, el.nameValue2)
      })

      // 开始动画循环
      animate()
      this.isSart = true

      // 轮询
      this.timer1 = setInterval(() => {
        this.handleUpdateModel()
        this.handleGetAreaStock().then(() => {
          this.clearMesh(this.positions)
          this.clearMesh(this.positions2)

          const text = (this.areaTotal.slice(0, 5) * 0.45).toFixed(0)
          this.positions = new THREE.Mesh(new TextGeometry('当前库存:' + text + '吨', {
            font: this.fontContent,
            size: 2,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
          this.positions.rotation.y = THREE.MathUtils.degToRad(-90)
          this.positions.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 8, -8)
          this.positions2 = new THREE.Mesh(new TextGeometry('Current Inventory:' + text + 't', {
            font: this.fontContent,
            size: 1,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
          this.positions2.rotation.y = THREE.MathUtils.degToRad(-90)
          this.positions2.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 6.5, -5)

          scene.add(this.positions, this.positions2)
        })
        this.handleGetDisAreaInfo().then(() => {
          this.areaList.forEach((ele) => {
            this.clearMesh(ele.stock)
            this.clearMesh(ele.stock1)
            this.clearMesh(ele.stock2)
            this.clearMesh(ele.stock3)
          })
          this.areaList.forEach((el, index) => {
            // 分区信息
            const text = (this.areaInfoList[index].areaStatus === 'FJ') ? this.areaInfoList[index].fermentationTime + '天' : ''
            const text2 = (this.areaInfoList[index].areaStatus === 'FJ') ? this.areaInfoList[index].fermentationTime + ' days' : ''
            const ance = 3.5
            const ance2 = 2
            // const ance3 = 2
            const ance4 = 2.5
            const filterAnce = this.filterEnDisArea(this.areaInfoList[index].areaStatus)
            el.stock = new THREE.Mesh(new TextGeometry(this.filterDisArea(this.areaInfoList[index].areaStatus), {
              font: this.fontContent,
              size: 1.5,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
            el.stock1 = new THREE.Mesh(new TextGeometry(text, {
              font: this.fontContent,
              size: 1.5,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
            el.stock2 = new THREE.Mesh(new TextGeometry(filterAnce.str, {
              font: this.fontContent,
              size: 1,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
            el.stock3 = new THREE.Mesh(new TextGeometry(text2, {
              font: this.fontContent,
              size: 1,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
            scene.add(el.stock, el.stock1, el.stock2, el.stock3)
            if (index === 0) {
              el.stock.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock1.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

              el.stock2.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock3.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
            } else if (index === 9) {
              el.stock.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock1.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

              el.stock2.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock3.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
            } else {
              el.stock.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 5.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock1.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 9, -(MODELSET.z / 2 - MODELSET.tlkZ))

              el.stock2.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - filterAnce.ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 7, -(MODELSET.z / 2 - MODELSET.tlkZ))
              el.stock3.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance4, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10.5, -(MODELSET.z / 2 - MODELSET.tlkZ))
            }
          })
        })
      }, 1200000)
      this.timer2 = setInterval(() => {
        this.handleGetTlkInfo().finally(() => {
          this.inputList.forEach((ele) => {
            this.clearMesh(ele.inputValue)
            this.clearMesh(ele.inputValue2)
          })

          this.inputList.forEach((el, index, arr) => {
            // 投料口占比
            const num = (Number(el.degreeLeft) + Number(el.degreeRight)) / 2
            const degreeColor1 = (num > el.materialPortThreshold) ? 0x00b050 : 0xff0000
            el.valueLeft.material.color.set(degreeColor1)
            el.valueLeft.scale.set(1, 1, num / 100)
            // el.valueLeft.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 2.5, -(MODELSET.z - MODELSET.tlkZ) / 2)
            // el.valueLeft.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) + 2, -(MODELSET.z - MODELSET.tlkZ) / 2 + MODELSET.tlkZ / 2 * (1 - num / 100)) // 1 - num / 100
            // 投炉
            el.inputValue = new THREE.Mesh(new TextGeometry('投炉' + el.furnaceInput + '吨', {
              font: this.fontContent,
              size: 1,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: 0xF25D22 }))
            el.inputValue.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2) - 0, MODELSET.y / 2 - 1.2, -MODELSET.z / 2 + 0.1)
            el.inputValue2 = new THREE.Mesh(new TextGeometry('Charging ' + el.furnaceInput + 't', {
              font: this.fontContent,
              size: 1,
              height: 0
            }), new THREE.MeshBasicMaterial({ color: 0xF25D22 }))
            el.inputValue2.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2) - 1.8, MODELSET.y / 2 - 2.5, -MODELSET.z / 2 + 0.1)

            scene.add(el.inputValue, el.inputValue2)
          })
        })
      }, 60000)
    })
  },
  beforeDestroy() {
    // 销毁模型
    // this.modelScene.remove()

    this.dischargeList.forEach((el) => {
      el.value.forEach((ele) => {
        this.clearMesh(ele)
      })
      this.clearMesh(el.fontValue)
      this.clearMesh(el.statusValue)
      this.clearMesh(el.ranging)
    })
    this.inputList.forEach((el) => {
      this.clearMesh(el.value)
      this.clearMesh(el.fontValue)
      this.clearMesh(el.degreeLeftValue)
      this.clearMesh(el.degreeRightValue)
      this.clearMesh(el.valueLeft)
      this.clearMesh(el.valueRight)
      this.clearMesh(el.fontValue2)
      this.clearMesh(el.inputValue2)
    })
    this.craneList.forEach((el) => {
      this.clearGltf(el.trackLeft)
      // this.clearGltf(el.trackRight)
      this.clearGltf(el.slider)
      this.clearGltf(el.claw1)
      this.clearGltf(el.claw2)
      this.clearMesh(el.line)
      this.clearMesh(el.craneShow)
      this.clearMesh(el.clawShow)
      this.clearMesh(el.stepText)
      this.clearGltf(el.garbage)
      this.clearMesh(el.position)
      this.clearMesh(el.nameValue)
      this.clearMesh(el.nameValue2)
    })
    this.areaList.forEach((el) => {
      this.clearMesh(el.textValue)
      this.clearMesh(el.lineValue)
      this.clearMesh(el.stock)
      this.clearMesh(el.stock1)
      this.clearMesh(el.xValue)
      this.clearMesh(el.stock2)
      this.clearMesh(el.stock3)
    })
    this.clearMesh(this.positions)
    this.clearMesh(this.positions2)
    this.clearMesh(this.platform)
    this.clearMesh(this.platform2)
    this.clearMesh(this.textLength)
    this.clearMesh(this.textLength2)
    this.clearMesh(this.textWidth)
    this.clearMesh(this.textWidth2)
    this.clearMesh(this.textHeight)
    this.clearMesh(this.textHeight2)
    this.clearMesh(this.textPitArea)
    this.clearMesh(this.textPitArea2)
    this.clearMesh(this.textXlmNum)
    this.clearMesh(this.textXlmNum2)
    this.clearGltf(this.garbagePoolmodel)
    // 销毁动画
    TWEEN.removeAll
    // 销毁定时器
    clearInterval(this.timer1)
    clearInterval(this.timer2)
    this.modelScene.children.forEach(obj => {
      if (obj instanceof THREE.Mesh) {
        this.clearMesh(obj)
      } else {
        this.clearGltf(obj)
      }
    })
    // 销毁监听器
    // this.$refs.container.removeEventListener('mousemove', this.onDocumentMouseMove)
  },
  methods: {
    filterDisArea,
    filterEnDisArea(key) {
      let str = ''
      let ance = 0
      switch (key) {
        case 'FJ':
          str = 'Fermentation' // Fermentation
          ance = 5
          break
        case 'TL':
          str = 'Charging' // Charging
          ance = 3.5
          break
        case 'JG':
          str = 'Separation' // Separation
          ance = 4
          break
        case 'DL':
          str = 'Stacking' // Stacking
          ance = 3.5
          break
        default:
          str = key
          break
      }
      return { str, ance }
    },
    numTofixed(val) {
      if (typeof val !== 'number') {
        val = parseFloat(val)
      }
      return val.toFixed(2)
    },
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
    handleMoveClaw(data, index) {
      const arrowX = this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.slider.xMin, CRANERACE.slider.xMax)
      const arrowY = this.mapValueToRange(data.z, 0, MODELSET.y, MODELSET.y / 2 - 1, -MODELSET.y / 2 + 1)
      const arrowZ = this.mapValueToRange(data.y, 0, MODELSET.z, MODELSET.z / 2, -MODELSET.z / 2)
      // 大车  material: {opacity: 1}
      this.craneList[index].trackLeftCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.trackLeft.xMin, CRANERACE.trackLeft.xMax)
      }, 300).start(undefined, true)
      // this.craneList[index].trackRightCustomAnimate.to({
      //   x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.trackRight.xMin, CRANERACE.trackRight.xMax)
      // }, 300).start(undefined, true)
      // 小车
      this.craneList[index].sliderCustomAnimate.to({
        x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.slider.xMin, CRANERACE.slider.xMax),
        z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.slider.zMin, CRANERACE.slider.zMax)
      }, 300).start(undefined, true)
      // 垃圾爪
      // this.craneList[index].clawCustomAnimate1.to({
      //   x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax),
      //   y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax),
      //   z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax)
      // }, 300).start(undefined, true)
      // 垃圾爪连线   不能改中心点,所以不能改大小 而要用缩放
      this.craneList[index].lineCustomAnimate.to({
        position: {
          x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.line.xMin, CRANERACE.line.xMax),
          z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.line.zMin, CRANERACE.line.zMax)
        },
        length: { y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.line.yMin, CRANERACE.line.yMax) }
      }, 300).start(undefined, true)
      // craneShow clawShow
      // this.craneList[index].craneShow.position.set(arrowX, MODELSET.y / 2 + 0.5, 0)
      // this.craneList[index].clawShow.position.set(arrowX, 14.5, MODELSET.z / 2 + 0.5)
      // 状态
      // 垃圾爪开合
      if (data.grabWeight > 10) {
        this.modelScene.remove(this.craneList[index].claw1)
        this.modelScene.add(this.craneList[index].claw2)
        this.modelScene.add(this.craneList[index].garbage)
        this.craneList[index].clawCustomAnimate2.to({
          x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax),
          y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax),
          z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax)
        }, 300).start(undefined, true)

        this.craneList[index].garbageCustomAnimate.to({
          x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax),
          y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax) - 5,
          z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax)
        }, 300).start(undefined, true)
        // this.craneList[index].garbage.position.set(this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax), this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax) - 3, this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax))
      } else {
        this.modelScene.remove(this.craneList[index].garbage)
        this.modelScene.remove(this.craneList[index].claw2)
        this.modelScene.add(this.craneList[index].claw1)
        this.craneList[index].clawCustomAnimate1.to({
          x: this.mapValueToRange(data.x, 0, MODELSET.x, CRANERACE.claw.xMin, CRANERACE.claw.xMax),
          y: this.mapValueToRange(data.z, 0, MODELSET.y, CRANERACE.claw.yMin, CRANERACE.claw.yMax),
          z: this.mapValueToRange(data.y, 0, MODELSET.z, CRANERACE.claw.zMin, CRANERACE.claw.zMax)
        }, 300).start(undefined, true)
      }

      // 压力数据
      // const unit = this.$props.currentLanguage ? '吨' : 't'
      if (data.grabWeight) {
        if (this.craneList[index].stepText) {
          this.clearMesh(this.craneList[index].stepText)
        }
        this.craneList[index].stepText = new THREE.Mesh(new TextGeometry(data.grabWeight.toFixed(2).toString() + '吨/t', {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        this.modelScene.add(this.craneList[index].stepText)
        this.craneList[index].stepText.position.set(arrowX + 0.5, arrowY - 7, arrowZ + 3)
      } else {
        if (this.craneList[index].stepText) {
          this.clearMesh(this.craneList[index].stepText)
        }
      }
      // 位置
      if (this.craneList[index].position) {
        this.clearMesh(this.craneList[index].position)
      }
      this.craneList[index].position = new THREE.Mesh(new TextGeometry('X:' + data.x.toFixed(2).toString() + ' Y:' + data.y.toFixed(2).toString(), {
        font: this.fontContent,
        size: 1,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
      this.modelScene.add(this.craneList[index].position)
      this.craneList[index].position.position.set(arrowX - 5, MODELSET.y / 2 + 0.5, MODELSET.z / 2 + 0.5)
      // 行车号
      this.craneList[index].nameValue.position.set(arrowX - 3, MODELSET.y / 2 - 3, MODELSET.z / 2 + 0.5)
      this.craneList[index].nameValue2.position.set(arrowX - 3, MODELSET.y / 2 - 4.5, MODELSET.z / 2 + 0.5)
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
        var positions = points.geometry.attributes.position.array
        var colors = []
        // 根据高度设置颜色
        var minHeight = 0 // 设置最小高度
        var maxHeight = 400 // 设置最大高度
        for (var i = 0; i < positions.length; i += 3) {
        // var x = positions[i]
        // var y = positions[i + 1];
          var z = positions[i + 2]
          var normalizedHeight = (z - minHeight) / (maxHeight - minHeight) // 将高度归一化到 [0, 1] 范围
          // 根据归一化高度值计算颜色
          var color = new THREE.Color()
          color.setHSL(normalizedHeight, 1, 0.2) // 使用HSL颜色空间来设置颜色 0.5
          colors.push(color.r, color.g, color.b)
        }
        // // 创建点云材质
        var material = new THREE.PointsMaterial({ vertexColors: true, size: 1 })
        // // var material = new THREE.PointsMaterial({ color: 0x495361, size: 0.2 })
        points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        // 创建点云对象
        var pointCloud = new THREE.Points(points.geometry, material)
        pointCloud.scale.set(0.1, 0.1, 0.075)
        pointCloud.rotation.y = THREE.MathUtils.degToRad(180)
        pointCloud.rotation.x = THREE.MathUtils.degToRad(90)
        pointCloud.position.set((MODELSET.x - MODELSET.wallX * 2) / 2, -MODELSET.y / 2 + 0.1, -MODELSET.z / 4 - 3)
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
    handleGetAreaStock() {
      return new Promise((resolve, reject) => {
        findPartTrash({ url: 'http://172.168.10.102:8925/sum_trash' })
          .then((res) => {
            this.areaTotal = res.data
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
          }
          this.areaRace = (121.4 - this.areaInfo.area1 - this.areaInfo.area10) / 8
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
                  el.furnaceInput = ele?.furnaceInput ? ele.furnaceInput.toFixed(0) : 0
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
    },
    async handleGetDisAreaInfo() {
      return new Promise((resolve, reject) => {
        disAreaInfo({
          pageNum: 1,
          pageSize: 10
        })
          .then((res) => {
            this.areaInfoList = res.data.list
            resolve(res) // Resolve with the parsed data
          })
          .catch(error => {
            reject(error) // Reject with the error if there is any
          })
      })
    },
    filterAreaColor(key) {
      let str = 0x000000
      switch (key) {
        case 'FJ':
          str = 0xee6666
          break
        case 'TL':
          str = 0x409eff
          break
        case 'JG':
          str = 0xfac858
          break
        case 'DL':
          str = 0x91cc75
          break
        default:
          break
      }
      return str
    },
    languageChange(val) {
      // 参观平台
      this.clearMesh(this.platform)
      const text1 = val ? '参观平台' : 'Visiting Platform'
      const z1 = val ? 5 : 8
      this.platform = new THREE.Mesh(new TextGeometry(text1, {
        font: this.fontContent,
        size: val ? 2 : 1.5,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
      this.platform.position.set(-MODELSET.x / 2 + 0.1, MODELSET.y / 2 - 3, z1)
      this.platform.rotation.y = THREE.MathUtils.degToRad(90)
      this.modelScene.add(this.platform)
      // 长宽高
      this.clearMesh(this.textLength)
      this.clearMesh(this.textWidth)
      this.clearMesh(this.textHeight)
      const text2 = val ? '长:121.4米' : 'Length:121.4m'
      const z2 = val ? 11 : 13
      const text3 = val ? '宽:26.4米' : 'Width:26.4m'
      const z3 = val ? 10 : 12
      const text4 = val ? '高:23米' : 'Height:23m'
      const z4 = val ? 9 : 11
      this.textLength = new THREE.Mesh(new TextGeometry(text2, {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textWidth = new THREE.Mesh(new TextGeometry(text3, {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textHeight = new THREE.Mesh(new TextGeometry(text4, {
        font: this.fontContent,
        size: 2,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textLength.rotation.y = THREE.MathUtils.degToRad(90)
      this.textWidth.rotation.y = THREE.MathUtils.degToRad(90)
      this.textHeight.rotation.y = THREE.MathUtils.degToRad(90)
      this.textLength.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 16, z2)
      this.textWidth.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 12, z3)
      this.textHeight.position.set(-MODELSET.x / 2 + MODELSET.wallX + 0.1, 8, z4)
      this.modelScene.add(this.textLength, this.textWidth, this.textHeight)
      // 坑内分区 卸料门数量
      this.clearMesh(this.textPitArea)
      this.clearMesh(this.textXlmNum)
      const text5 = val ? '坑内分区:10区' : 'Zone 10 within the Pit'
      const z5 = val ? -6 : -8
      const text6 = val ? '卸料门数量:16个' : 'Discharge Gates: 16'
      const z6 = val ? -7 : -7
      this.textPitArea = new THREE.Mesh(new TextGeometry(text5, {
        font: this.fontContent,
        size: val ? 2 : 1.5,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textXlmNum = new THREE.Mesh(new TextGeometry(text6, {
        font: this.fontContent,
        size: val ? 2 : 1.5,
        height: 0
      }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
      this.textPitArea.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textXlmNum.rotation.y = THREE.MathUtils.degToRad(-90)
      this.textPitArea.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 16, z5)
      this.textXlmNum.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 12, z6)
      this.modelScene.add(this.textPitArea, this.textXlmNum)
      // 库存量
      const text7 = val ? '当前库存:' : 'Current Inventory:'
      const unit1 = val ? '吨' : 't'
      const z7 = val ? -8 : -9.5
      this.handleGetAreaStock().then(() => {
        this.clearMesh(this.positions)

        const text = (this.areaTotal.slice(0, 5) * 0.45).toFixed(0) + unit1
        this.positions = new THREE.Mesh(new TextGeometry(text7 + text, {
          font: this.fontContent,
          size: val ? 2 : 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x024696 }))
        this.positions.rotation.y = THREE.MathUtils.degToRad(-90)
        this.positions.position.set(MODELSET.x / 2 - MODELSET.wallX - 0.1, 8, z7)
        this.modelScene.add(this.positions)
      })
      // 行车号
      this.craneList.forEach((el) => {
        this.clearMesh(el.nameValue)
        const text = val ? el.name : el.enName
        el.nameValue = new THREE.Mesh(new TextGeometry(text, {
          font: this.fontContent,
          size: 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.nameValue.position.set(0, MODELSET.y / 2 - 3, MODELSET.z / 2 + 0.5)
        this.modelScene.add(el.nameValue)
      })
      // 投料口
      this.inputList.forEach((el, index, arr) => {
        this.clearMesh(el.fontValue)
        const text = val ? el.key : el.enKey
        const x = val ? 4.5 : 9.5
        el.fontValue = new THREE.Mesh(new TextGeometry(text, {
          font: this.fontContent,
          size: val ? 2 : 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))// 52
        el.fontValue.position.set((MODELSET.tlkX + 17) * index - x - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2), MODELSET.y / 2 - 2.5, -MODELSET.z / 2 + 0.1)
        this.modelScene.add(el.fontValue)
      })
      // 投炉
      this.handleGetTlkInfo().finally(() => {
        this.inputList.forEach((el, index, arr) => {
          this.clearMesh(el.inputValue)
          const text = val ? '投炉' : 'Charging '
          const unit = val ? '吨' : 't'
          const x = val ? 4 : 5
          el.inputValue = new THREE.Mesh(new TextGeometry(text + el.furnaceInput + unit, {
            font: this.fontContent,
            size: val ? 2 : 1.5,
            height: 0
          }), new THREE.MeshBasicMaterial({ color: 0xF25D22 }))
          el.inputValue.position.set((MODELSET.tlkX + 17) * index - ((MODELSET.x - MODELSET.wallX * 2) / 2 - MODELSET.tlkX / 2 - (MODELSET.x - MODELSET.wallX * 2 - MODELSET.tlkX * arr.length - 17 * (arr.length - 1)) / 2) + x, MODELSET.y / 2 - 2.5, -MODELSET.z / 2 + 0.1)
          this.modelScene.add(el.inputValue)
        })
      })
      // 分区
      this.areaList.forEach((el, index) => {
        // 编号
        this.clearMesh(el.textValue)
        const text = val ? el.text : el.enText
        const x = val ? 2.5 : 3.5
        el.textValue = new THREE.Mesh(new TextGeometry(text, {
          font: this.fontContent,
          size: val ? 2 : 1.5,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0x000000 }))
        this.modelScene.add(el.textValue)
        if (index === 0) {
          el.textValue.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - x, MODELSET.y / 2 - 3 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else if (index === 9) {
          el.textValue.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - x, MODELSET.y / 2 - 3 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else {
          el.textValue.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - x, MODELSET.y / 2 - 3 - (MODELSET.y - MODELSET.tlkY), -(MODELSET.z / 2 - MODELSET.tlkZ))
        }
      })
      // 分区信息
      this.areaList.forEach((el, index) => {
        this.clearMesh(el.stock)
        this.clearMesh(el.stock1)
        const api = val ? this.filterDisArea : this.filterEnDisArea
        // const unit1 = val ? '区' : ''
        const unit2 = val ? '天' : ' days'
        const text = (this.areaInfoList[index].areaStatus === 'FJ') ? this.areaInfoList[index].fermentationTime + unit2 : ''
        const ance = val ? 4 : 3
        const ance2 = val ? 3 : 4
        el.stock = new THREE.Mesh(new TextGeometry(api(this.areaInfoList[index].areaStatus), {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        el.stock1 = new THREE.Mesh(new TextGeometry(text, {
          font: this.fontContent,
          size: val ? 2.5 : 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: this.filterAreaColor(this.areaInfoList[index].areaStatus) }))
        this.modelScene.add(el.stock, el.stock1)
        if (index === 0) {
          el.stock.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 6, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set((this.areaInfo.area1 / 2) - (MODELSET.x - MODELSET.wallX * 2) / 2 - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else if (index === 9) {
          el.stock.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 6, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set((MODELSET.x - MODELSET.wallX * 2) / 2 - (this.areaInfo.area10 / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10, -(MODELSET.z / 2 - MODELSET.tlkZ))
        } else {
          el.stock.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 6, -(MODELSET.z / 2 - MODELSET.tlkZ))
          el.stock1.position.set(this.areaRace * (index - 1) + this.areaInfo.area1 - (MODELSET.x - MODELSET.wallX * 2) / 2 + (this.areaRace / 2) - ance2, MODELSET.y / 2 - (MODELSET.y - MODELSET.tlkY) - 10, -(MODELSET.z / 2 - MODELSET.tlkZ))
        }
      })
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
