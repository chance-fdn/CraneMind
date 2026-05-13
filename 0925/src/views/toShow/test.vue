<template>
  <div style="width: 100%; height: 100%; position: absolute;">
    <div ref="salaContainer" style="width: 100%; height: 100%;" />
  </div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { findDoorQueue } from '@/api/car'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MODELSET = {
  x: 121.4,
  y: 34,
  z: 32.4,
  tlkY: 34, // 投料口(墙壁)-高
  tlkZ: 6, // 投料口-宽
  tlkX: 16, // 投料口-长
  mask: 0, // 前面卸料门的遮挡 13
  xlmX: 3.8, // 卸料门-长
  xlmY: 8, // 卸料门-高
  wallX: 8 // 左右墙壁的宽
}

export default {
  inject: ['parent'],
  data() {
    return {
      modelScene: null,
      modelCamera: null,
      dischargeList: [
        {
          key: '01',
          value: null, // 卸料门模型
          fontValue: null, // 编号
          statusValue: null, // 状态
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '02',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '03',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '04',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '05',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '06',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '07',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '08',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '09',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '10',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '11',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '12',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '13',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '14',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '15',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        },
        {
          key: '16',
          value: null,
          fontValue: null,
          statusValue: null,
          statusAnimate: null,
          rangingAnimate1: null,
          rangingAnimate2: null,
          ranging1: null,
          ranging2: null,
          car1: null,
          car1Animate: null,
          plate: []
        }
      ],
      fontContent: null
    }
  },
  watch: {
    'parent.doorData': {
      handler(newVal, oldVal) {
        newVal && newVal.map((data, index) => {
          this.handleDoorStatusChange(data, index)
        })
      },
      deep: true
    }
  },
  mounted() {
    const dom = this.$refs.salaContainer
    const loader = new GLTFLoader()
    // 创建场景
    const scene = new THREE.Scene()
    this.modelScene = scene
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, dom.clientWidth / dom.clientHeight, 0.1, 1000)
    this.modelCamera = camera
    camera.position.z = 35
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ alpha: true })
    renderer.setSize(dom.clientWidth, dom.clientHeight)
    dom.appendChild(renderer.domElement)

    // 创建控制器
    const controls = new OrbitControls(camera, renderer.domElement)
    // 设置控制器的初始位置
    controls.target.set(0, 0, 0)

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    // 设置曝光度
    renderer.toneMappingExposure = 0.8 // 适当调整曝光度
    // 光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)// 光源
    directionalLight.position.set(400, 200, 300)
    scene.add(directionalLight)
    // 边框
    const lineGeometry1 = new THREE.BoxGeometry(MODELSET.x, 0.1, 0.1)
    const lineGeometry2 = new THREE.BoxGeometry(0.1, MODELSET.y, 0.1)
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const line1 = new THREE.Mesh(lineGeometry1, lineMaterial)
    const line3 = new THREE.Mesh(lineGeometry1, lineMaterial)
    line1.position.set(0, 0, 0)
    line3.position.set(0, MODELSET.y, 0)
    const line2 = new THREE.Mesh(lineGeometry2, lineMaterial)
    const line4 = new THREE.Mesh(lineGeometry2, lineMaterial)
    line2.position.set(MODELSET.x / 2, MODELSET.y / 2, 0)
    line4.position.set(-MODELSET.x / 2, MODELSET.y / 2, 0)
    scene.add(line1, line2, line3, line4)
    // 卸料门
    // const transparentMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 })
    const rangingTexture = new THREE.TextureLoader().load('/static/bg_pit.jpg')
    const rangingGeometry1 = new THREE.BoxGeometry(MODELSET.xlmX / 2, MODELSET.xlmY, 1)
    const rangingGeometry2 = new THREE.BoxGeometry(MODELSET.xlmX / 2, MODELSET.xlmY, 1)
    rangingGeometry1.translate(MODELSET.xlmX / 4, 0, 0)
    rangingGeometry2.translate(-MODELSET.xlmX / 4, 0, 0)
    // const rangingMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    const rangingMaterial = new THREE.MeshBasicMaterial({ map: rangingTexture })
    const backgroundTexture = new THREE.TextureLoader().load('/static/bg_4.jpg')
    const dischargeGeometry1 = new THREE.BoxGeometry(MODELSET.xlmX, 0.2, 1)
    const dischargeGeometry2 = new THREE.BoxGeometry(0.2, MODELSET.xlmY + 0.2, 1)
    const dischargeMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture })
    const circleGeometry = new THREE.SphereGeometry(0.7) // 状态
    this.dischargeList.forEach((door, index, arr) => {
      door.value = [
        new THREE.Mesh(dischargeGeometry1, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry1, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry2, dischargeMaterial),
        new THREE.Mesh(dischargeGeometry2, dischargeMaterial)
      ]
      door.value[0].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX / 2), 0, 0)
      door.value[1].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX / 2), MODELSET.xlmY, 0)
      door.value[2].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6), MODELSET.xlmY / 2, 0)
      door.value[3].position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX), MODELSET.xlmY / 2, 0)

      door.statusValue = new THREE.Mesh(circleGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true }))
      door.statusValue.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX / 2), MODELSET.xlmY, 0)
      door.statusAnimate = new TWEEN.Tween(door.statusValue.material).dynamic(true)

      door.ranging1 = new THREE.Mesh(rangingGeometry1, rangingMaterial)
      door.ranging1.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6), MODELSET.xlmY / 2, 0)
      door.ranging1.rotation.y = THREE.MathUtils.degToRad(30)
      door.rangingAnimate1 = new TWEEN.Tween(door.ranging1.rotation).dynamic(true)
      door.ranging2 = new THREE.Mesh(rangingGeometry2, rangingMaterial)
      door.ranging2.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX), MODELSET.xlmY / 2, 0)
      door.ranging2.rotation.y = THREE.MathUtils.degToRad(-30)
      door.rangingAnimate2 = new TWEEN.Tween(door.ranging2.rotation).dynamic(true)

      scene.add(door.value[0], door.value[1], door.value[2], door.value[3], door.ranging1, door.ranging2, door.statusValue)

      // 垃圾车
      loader.load('/static/garbage_truck.glb', (gltf) => {
        door.car1 = gltf.scene
        door.car1.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX / 2), 0, 0)
        door.car1.rotation.y = THREE.MathUtils.degToRad(-35)
        scene.add(door.car1)
        door.car1Animate = new TWEEN.Tween(door.car1.position).dynamic(true)
      }, undefined, function(error) {
        console.error(error)
      })
    })

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
    fontPromise.then(() => {
      // 卸料门的编号
      this.dischargeList.forEach((el, index, arr) => {
        el.fontValue = new THREE.Mesh(new TextGeometry(el.key, {
          font: this.fontContent,
          size: 2,
          height: 0
        }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        el.fontValue.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - 1.5 - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX / 2), MODELSET.xlmY + 1, 0)
        // el.plate = new THREE.Mesh(new TextGeometry('渝A·E23IL', {
        //   font: this.fontContent,
        //   size: 0.4,
        //   height: 0
        // }), new THREE.MeshBasicMaterial({ color: 0xffffff }))
        // el.plate.position.set((MODELSET.xlmX + ((MODELSET.x - MODELSET.xlmX * arr.length - 7.6 * 2) / (arr.length - 1))) * index - (MODELSET.x / 2 - 7.6 - MODELSET.xlmX), MODELSET.xlmY - 0.5, 0)
        scene.add(el.fontValue)
      })
      // return this.handleGetXlmInfo() findDoorQueue
    }).then(() => {

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
    animate()
  },
  beforeDestroy() {
    this.dischargeList.forEach((el) => {
      el.value.forEach((ele) => {
        this.modelScene.remove(ele)
        ele = null
      })
      this.modelScene.remove(el.fontValue)
      el.fontValue = null
      this.modelScene.remove(el.statusValue)
      el.statusValue = null
      this.modelScene.remove(el.ranging1)
      el.ranging1 = null
      this.modelScene.remove(el.ranging2)
      el.ranging2 = null
      this.modelScene.remove(el.car1)
      el.car1 = null
    })
    // 销毁动画
    TWEEN.removeAll
  },
  methods: {
    handleDoorStatusChange(data, index) {
      let color
      let glitter = false
      this.modelScene.remove(this.dischargeList[index].car1)
      switch (data.status) {
        case 1: // 'opened' 绿
          color = 0x2ec64f
          this.dischargeList[index].ranging1.rotation.y = THREE.MathUtils.degToRad(90)
          this.dischargeList[index].ranging2.rotation.y = THREE.MathUtils.degToRad(-90)
          this.modelScene.add(this.dischargeList[index].car1)
          this.dischargeList[index].car1Animate.to({
            z: -10
          }, 500).start(undefined, true)
          break
        case 2: // 'closed' 红
          color = 0xff0000
          this.dischargeList[index].ranging1.rotation.y = THREE.MathUtils.degToRad(0)
          this.dischargeList[index].ranging2.rotation.y = THREE.MathUtils.degToRad(0)
          this.modelScene.add(this.dischargeList[index].car1)
          this.dischargeList[index].car1Animate.to({
            z: 10
          }, 500).start(undefined, true)
          break
        case 3: // 'opening' 绿+闪
          color = 0x2ec64f
          glitter = true
          this.dischargeList[index].rangingAnimate1.to({
            y: THREE.MathUtils.degToRad(90)
          }, 500).start(undefined, true)
          this.dischargeList[index].rangingAnimate2.to({
            y: THREE.MathUtils.degToRad(-90)
          }, 500).start(undefined, true)
          break
        case 4: // 'closeing' 红+闪
          color = 0xff0000
          glitter = true
          this.dischargeList[index].rangingAnimate1.to({
            y: THREE.MathUtils.degToRad(0)
          }, 500).start(undefined, true)
          this.dischargeList[index].rangingAnimate2.to({
            y: THREE.MathUtils.degToRad(0)
          }, 500).start(undefined, true)
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
    handleGetXlmInfo() {
      return new Promise((resolve, reject) => {
        findDoorQueue({
          pageNum: 1,
          pageSize: 20
        }).then((res) => {
          // if (res.success) {

          // }
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
