
export function lineChars(myChart, config) {
  const { data, xData, yMax, showLength, color, legendShow } = config
  var option
  option = {
    // title: {
    //   left: 'center',
    //   text: title || '',
    //   textStyle: {
    //     color: '#fff'
    //   }
    // },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      show: !legendShow,
      textStyle: {
        fontSize: color?.fontSize,
        color: color?.color || '#000' // 设置图例文本颜色为绿色
      },
      top: 20
      // data: ['一号', '二号', '三号']
    },
    grid: {
      top: legendShow ? 10 : 60,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    // X滑动框
    dataZoom: [
      {
        type: 'slider', // 滑动条
        show: true, // 开启
        xAxisIndex: [0],
        startValue: xData?.length - showLength // 开始位置
        // bottom: -20
      }
    ],
    // toolbox: {
    //   feature: {
    //     saveAsImage: {}
    //   }
    // },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLabel: {
        fontSize: color?.fontSize,
        color: color?.color || '#000' // 设置X轴标签颜色为红色
      }
    },
    yAxis: {
      type: 'value',
      max: yMax,
      axisLabel: {
        fontSize: color?.fontSize,
        color: color?.color || '#000' // 设置X轴标签颜色为红色
      }
    },
    series: data
    // series: [
    // {
    // name: '一号',
    // type: 'line',
    // stack: 'Total', // 数据堆叠,相应的Y轴的刻度就不是正常的值 而是堆叠的值; 不堆叠的话数据值过于接近 会导致折线重叠 展示不清晰
    // data: data
    // }
    // {
    //   name: '二号',
    //   type: 'line',
    //   // stack: 'Total',
    //   data: data[1][type]
    // },
    // {
    //   name: '三号',
    //   type: 'line',
    //   // stack: 'Total',
    //   data: data[2][type]
    // }
    // ]
  }
  // console.log('---------------', option.legend.show)
  option && myChart.setOption(option)
}
