'use strict'
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: false, // 关闭lint检查
  productionSourceMap: false,
  devServer: {
    port: 9528,
    open: true,
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' }
      }
    }
  },
  css: {
    loaderOptions: {
      sass: {
        // 导入所有必要的SCSS文件
        additionalData: (content, loaderContext) => {
          const { resourcePath } = loaderContext;
          // 如果正在处理这三个文件本身，不添加导入
          if (resourcePath.includes('variables.scss') || 
              resourcePath.includes('mixin.scss') || 
              resourcePath.includes('element-ui.scss')) {
            return content;
          }
          return `
            @import "@/styles/variables.scss";
            @import "@/styles/mixin.scss";
            @import "@/styles/element-ui.scss";
            ${content}
          `;
        }
      }
    }
  },
  configureWebpack: {
    name: '垃圾储坑智能化管控系统',
    resolve: {
      alias: {
        '@': resolve('src')
      },
      fallback: {
        "path": require.resolve("path-browserify")
      }
    }
  },
  chainWebpack: config => {
    // 禁用所有高级优化，先确保项目能运行
    config.plugins.delete('prefetch')
    config.plugins.delete('preload')
    
    // 简化svg处理
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()
  }
}