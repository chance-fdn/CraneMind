<template>
  <div ref="vtkContainer" style="width: 400px; height: 400px;" />
</template>

<script>
import vtk from 'vtk.js'

export default {
  mounted() {
    // 获取vtk.js容器的引用
    const container = this.$refs.vtkContainer

    // 创建vtk.js渲染器和场景
    const renderer = vtk.Rendering.Core.vtkRenderer.newInstance()
    const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance()
    renderWindow.addRenderer(renderer)

    // 将vtk.js渲染窗口绑定到Vue组件的容器中
    renderWindow.setContainer(container)

    // 创建一个简单的几何体并添加到场景中
    const source = vtk.Filters.Sources.vtkSphereSource.newInstance()
    const mapper = vtk.Rendering.Core.vtkMapper.newInstance()
    mapper.setInputConnection(source.getOutputPort())
    const actor = vtk.Rendering.Core.vtkActor.newInstance()
    actor.setMapper(mapper)
    renderer.addActor(actor)

    // 渲染场景
    renderWindow.render()
  }
}
</script>
