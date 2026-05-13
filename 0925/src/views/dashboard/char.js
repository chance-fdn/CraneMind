import * as echarts from 'echarts'
import 'echarts-gl'

export function ringChar(myChart, config) {
  var option
  // config = config.length ? config : [
  //   { value: 735, name: '投料' },
  //   { value: 200, name: '堆料' },
  //   { value: 580, name: '沥水' },
  //   { value: 484, name: '揭盖' },
  //   { value: 300, name: '清底' },
  //   { value: 300, name: '挖沟' },
  //   { value: 0, name: '避让' }
  // ]
  const totalNum = config.reduce((pre, cur) => pre + cur?.value, 0)

  option = {
    title: {
      text: '今日任务', // 主标题
      textStyle: { // 主标题样式
        color: '#fff',
        fontWeight: 'normal',
        fontSize: 14
      },
      left: '47%', // 定位到适合的位置
      top: '27%', // 定位到适合的位置
      subtext: totalNum, // 副标题
      subtextStyle: { // 副标题样式
        color: '#fff',
        fontSize: 12
      },
      textAlign: 'center' // 主、副标题水平居中显示
    },
    tooltip: {
      trigger: 'item',
      confine: true // 图内显示
    },
    legend: {
      // show: false
      bottom: 60,
      textStyle: {
        color: '#fff',
        fontSize: 13
      }
    },
    series: [
      {
        name: '任务统计',
        type: 'pie',
        // top: -250,
        radius: ['40%', '80%'], // 内外半径
        center: ['50%', '35%'], // 饼图位置x,y
        avoidLabelOverlap: false,
        label: {
          color: '#fff',
          position: 'inner',
          formatter: '{d}' + '%'
        },
        labelLine: {
          show: false
        },
        data: config
      }
    ]
  }

  option && myChart.setOption(option)
}

export function barChar(myChart, config) {
  // var chartDom = document.getElementById(id)
  // var myChart = echarts.init(chartDom)
  // 数组排序
  const indexedArray = config[3].data.map((value, index) => [index, value])
  indexedArray.sort((a, b) => a[1] - b[1])
  // 获取排序后的索引
  const sortedIndexes = []
  indexedArray.map(item => {
    // if (item[1]) {
    sortedIndexes.push(item[0])
    // }
  })

  var option

  option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let str
        params.map((el) => {
          if (el.value) {
            str = el.value
          }
        })
        return params[0].axisValue + '区' + '\n发酵: ' + str + '天'
      }
      // valueFormatter: (value) => '发酵' + value + '天'
    },
    legend: {
      textStyle: {
        color: '#fff',
        fontSize: 13
      }
    },
    grid: {
      left: 0,
      right: 0,
      bottom: 30
    },
    xAxis: [
      {
        type: 'category',
        axisLine: {
          lineStyle: {
            color: '#fff'
          }
        },
        axisLabel: {
          interval: 0
        },
        data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
      }
    ],
    yAxis: [
      {
        type: 'value',
        show: false
      }
    ],
    series: [
      {
        name: '投料区',
        type: 'bar',
        stack: 'Ad',
        data: config[0].data
      },
      {
        name: '堆料区',
        type: 'bar',
        stack: 'Ad',
        data: config[1].data
      },
      {
        name: '间隔区',
        type: 'bar',
        stack: 'Ad',
        data: config[2].data
      },
      {
        name: '发酵区',
        type: 'bar',
        stack: 'Ad',
        // label: { // 柱内显示数据
        //   show: true,
        //   position: 'inside'
        // },
        data: config[3].data,
        itemStyle: {
          // 设置不同的颜色
          color: function(params) {
            var colorList = ['#FFF0F5', '#FFE4E1', '#FFB6C1', '#FFC0CB', '#FF69B4', '#D87093', '#C71585', '#FF1493', '#DC143C', '#FF0000']
            const index = sortedIndexes.indexOf(params.dataIndex)
            return colorList[index]
          }
        }
      }
    ]
  }

  option && myChart.setOption(option)
}

export function testChar(id) {
  var chartDom = document.getElementById(id)
  var myChart = echarts.init(chartDom)
  var option

  option = {
    tooltip: {},
    backgroundColor: '#fff',
    visualMap: {
      show: false,
      dimension: 2,
      min: -1,
      max: 1,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026'
        ]
      }
    },
    xAxis3D: {
      type: 'value'
    },
    yAxis3D: {
      type: 'value'
    },
    zAxis3D: {
      type: 'value',
      max: 1,
      splitNumber: 2
    },
    grid3D: {
      viewControl: {
      // projection: 'orthographic'
      },
      boxHeight: 40
    },
    series: [
      {
        type: 'surface',
        wireframe: {
          show: false
        },
        shading: 'color',
        equation: {
          x: {
            step: 0.05,
            min: -3,
            max: 3
          },
          y: {
            step: 0.05,
            min: -3,
            max: 3
          },
          z: function(x, y) {
            return (Math.sin(x * x + y * y) * x) / 3.14
          }
        }
      }
    ]
  }

  option && myChart.setOption(option)
}

export function glChar(myChart, data) {
  var option
  // console.log('-------------', data)
  option = {
    // 设置 silent 为 true 禁用用户交互
    silent: true,
    backgroundColor: '',
    visualMap: {
      show: false,
      dimension: 2, // 0 x; 1 y; 2 z
      min: 5,
      max: 20,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026'
        ]
      }
    },
    // 需要注意的是我们不能跟 grid 一样省略 grid3D
    grid3D: {
      show: false, // 隐藏坐标系
      boxWidth: 770, // 770
      boxHeight: 95, //
      boxDepth: 160, // 100
      // environment: require('@/assets/bg_pit.jpg'),
      viewControl: {
        // 无法旋转
        rotateSensitivity: 0,
        // 无法缩放
        zoomSensitivity: 0,
        // 无法平移
        panSensitivity: 0,
        projection: 'orthographic', // 正交投影 - 不会近大远小
        alpha: 30, // 沿x轴旋转
        beta: 3, // 沿y轴旋转
        center: [0, -30, 0]
      },
      light: {
        main: {
          shadow: true,
          shadowQuality: 'low',
          alpha: 45
        }
      }
    },
    // 默认情况下, x, y, z 分别是从 0 到 1 的数值轴
    xAxis3D: {
      max: 121.4
    },
    yAxis3D: {
      max: 28
    },
    zAxis3D: {
      // max: 30
    },
    series: [{
      type: 'bar3D', // surface 曲线; bar3D 柱状; scatter3D 散点
      data: data,
      bevelSize: 1,
      // wireframe: { // 网格线 表面光滑
      //   show: false
      // },
      itemStyle: {
        color: '#fee090',
        opacity: 0.9
      },
      shading: 'lambert', // 有光照阴影 lambert; 真实材质 realistic; 无 color
      realisticMaterial: {
        detailTexture: '', // 贴图 - 高宽: 2的n次方
        textureTiling: 1, // 拉伸平铺; 大于1 平铺重复的次数
        roughness: 0.5 // 粗糙度 0-1
      },
      emphasis: { // 柱状图顶点的 label
        label: {
          show: false
        }
      }
    }]
  }

  option && myChart.setOption(option)
}

export function glBottomChar(myChart, data) {
  var option
  // console.log('-------------', data)
  option = {
    // 设置 silent 为 true 禁用用户交互
    silent: true,
    backgroundColor: '',
    visualMap: {
      show: false,
      dimension: 2, // 0 x; 1 y; 2 z
      min: 5,
      max: 20,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026'
        ]
      }
    },
    // 需要注意的是我们不能跟 grid 一样省略 grid3D
    grid3D: {
      show: false, // 隐藏坐标系
      boxWidth: 720, // 770
      boxHeight: 200, //
      boxDepth: 170, // 100
      // environment: require('@/assets/bg_pit.jpg'),
      viewControl: {
        // 无法旋转
        rotateSensitivity: 0,
        // 无法缩放
        zoomSensitivity: 0,
        // 无法平移
        panSensitivity: 0,
        projection: 'orthographic', // 正交投影 - 不会近大远小
        alpha: 80, // 沿x轴旋转
        beta: 0 // 沿y轴旋转
        // center: [0, -10, 0]
      },
      light: {
        main: {
          shadow: true,
          shadowQuality: 'low',
          alpha: 60
        }
      }
    },
    // 默认情况下, x, y, z 分别是从 0 到 1 的数值轴
    xAxis3D: {
      max: 121.4
    },
    yAxis3D: {
      // max: 50
    },
    zAxis3D: {
      // max: 30
    },
    series: [{
      type: 'bar3D', // surface 曲线; bar3D 柱状; scatter3D 散点
      data: data,
      bevelSize: 1,
      // wireframe: { // 网格线 表面光滑
      //   show: false
      // },
      itemStyle: {
        color: '#fee090',
        opacity: 0.9
      },
      shading: 'lambert', // 有光照阴影 lambert; 真实材质 realistic; 无 color
      realisticMaterial: {
        detailTexture: '', // 贴图 - 高宽: 2的n次方
        textureTiling: 1, // 拉伸平铺; 大于1 平铺重复的次数
        roughness: 0.5 // 粗糙度 0-1
      },
      emphasis: { // 柱状图顶点的 label
        label: {
          show: false
        }
      }
    }]
  }

  option && myChart.setOption(option)
}

export function glTestChar(myChart, data) {
  var option
  // console.log('-------------', data)
  option = {
    // 设置 silent 为 true 禁用用户交互
    // silent: true,
    backgroundColor: '',
    visualMap: {
      show: false,
      dimension: 2, // 0 x; 1 y; 2 z
      min: 5,
      max: 20,
      inRange: {
        color: [
          '#313695',
          '#4575b4',
          '#74add1',
          '#abd9e9',
          '#e0f3f8',
          '#ffffbf',
          '#fee090',
          '#fdae61',
          '#f46d43',
          '#d73027',
          '#a50026'
        ]
      }
    },
    // 需要注意的是我们不能跟 grid 一样省略 grid3D
    grid3D: {
      show: false, // 隐藏坐标系
      // boxWidth: 720, // 770
      // boxHeight: 200, //
      // boxDepth: 170, // 100
      // environment: require('@/assets/bg_pit.jpg'),
      viewControl: {
        // 无法旋转
        // rotateSensitivity: 0,
        // 无法缩放
        // zoomSensitivity: 0,
        // 无法平移
        // panSensitivity: 0,
        projection: 'orthographic', // 正交投影 - 不会近大远小
        // alpha: 80, // 沿x轴旋转
        beta: 15 // 沿y轴旋转
        // center: [0, -10, 0]
      },
      light: {
        main: {
          shadow: true,
          shadowQuality: 'low',
          alpha: 60
        }
      }
    },
    // 默认情况下, x, y, z 分别是从 0 到 1 的数值轴
    xAxis3D: {
      max: 121.4
    },
    yAxis3D: {
      // max: 50
    },
    zAxis3D: {
      // max: 30
    },
    series: [{
      type: 'bar3D', // surface 曲线; bar3D 柱状; scatter3D 散点
      data: data,
      bevelSize: 1,
      // wireframe: { // 网格线 表面光滑
      //   show: false
      // },
      itemStyle: {
        color: '#fee090',
        opacity: 0.9
      },
      shading: 'lambert', // 有光照阴影 lambert; 真实材质 realistic; 无 color
      realisticMaterial: {
        detailTexture: '', // 贴图 - 高宽: 2的n次方
        textureTiling: 1, // 拉伸平铺; 大于1 平铺重复的次数
        roughness: 0.5 // 粗糙度 0-1
      },
      emphasis: { // 柱状图顶点的 label
        label: {
          // show: false
        }
      }
    }]
  }

  option && myChart.setOption(option)
}
