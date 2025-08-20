const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发服务器配置
  devServer: {
    port: 8080,
    host: 'localhost',
    https: false,
    open: false, // 不自动打开浏览器（因为我们使用Electron）
    hot: true,
    client: {
    overlay: false
  },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  
  // 构建配置
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  indexPath: 'index.html',
  
  // 是否在保存时进行lint检查
  lintOnSave: process.env.NODE_ENV !== 'production',
  
  // 生产环境是否生成sourceMap
  productionSourceMap: false,
  
  // 配置别名
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@common': path.resolve(__dirname, 'src/common'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@styles': path.resolve(__dirname, 'src/styles')
      }
    },
    
    // 外部依赖（Electron环境）
    externals: process.env.NODE_ENV === 'production' ? {
      'electron': 'require("electron")',
      'fs': 'require("fs")',
      'path': 'require("path")',
      'os': 'require("os")'
    } : {},
    
    // 性能优化
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          elementPlus: {
            name: 'chunk-element-plus',
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            priority: 20
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  
  // Webpack链式配置
  chainWebpack: config => {
    // 设置title
   const pages = require('./package.json').vue?.pages || { index: {} }

  for (const name of Object.keys(pages)) {
    const htmlPlugin = `html-${name}`
    const preloadPlugin = `preload-${name}`
    const prefetchPlugin = `prefetch-${name}`

    if (config.plugins.has(htmlPlugin)) {
      config.plugin(htmlPlugin).tap(args => {
        args[0].title = 'Multi Social Platform'
        return args
      })
    }

    if (config.plugins.has(preloadPlugin)) {
      config.plugin(preloadPlugin).tap(() => [
        {
          rel: 'preload',
          include: 'initial',
          fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/]
        }
      ])
    }

    if (config.plugins.has(prefetchPlugin)) {
      config.plugin(prefetchPlugin).tap(() => [
        {
          rel: 'prefetch',
          include: 'asyncChunks'
        }
      ])
    }
  }
    
    // SVG处理
    config.module
      .rule('svg')
      .exclude.add(path.resolve(__dirname, 'src/icons'))
      .end()
    
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(path.resolve(__dirname, 'src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
    
    // 图片压缩
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 80 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.8], speed: 4 },
        gifsicle: { interlaced: false },
        webp: { quality: 80 }
      })
      .end()
    
    // 开发环境优化
    if (process.env.NODE_ENV === 'development') {
      config.optimization.minimize(false)
    }
    
    // 生产环境优化
    if (process.env.NODE_ENV === 'production') {
      // 移除console
      
      
      // Gzip压缩
      config.plugin('compression').use(require('compression-webpack-plugin'), [{
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      }])
    }
  },
  
  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV !== 'production',
    loaderOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
      },
       postcss: {
      postcssOptions: { // ✅ 关键修正点
        plugins: [
          require('autoprefixer')({
            overrideBrowserslist: [
              'Chrome > 60',
              'Firefox > 60',
              'Safari > 12',
              'Edge > 18'
            ]
          })
        ]
      }
    }}
  },
  
  // 插件选项
  pluginOptions: {
    // Element Plus 自动导入
    'element-plus': {
      useSource: true
    },
    
    // PWA配置（如果需要）
    pwa: {
      name: 'Multi Social Platform',
      themeColor: '#409EFF',
      msTileColor: '#000000',
      appleMobileWebAppCapable: 'yes',
      appleMobileWebAppStatusBarStyle: 'black',
      workboxPluginMode: 'InjectManifest',
      workboxOptions: {
        swSrc: 'public/sw.js'
      }
    }
  },
  
  // 并行构建
  parallel: require('os').cpus().length > 1,
  
  // 第三方插件选项
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Multi Social Platform',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    }
  },
  
  // 静态资源内联阈值
  assetsDir: 'static',
  
  // 多页面配置示例（如果需要）
  // pages: {
  //   index: {
  //     entry: 'src/main.js',
  //     template: 'public/index.html',
  //     filename: 'index.html'
  //   },
  //   about: {
  //     entry: 'src/pages/about/main.js',
  //     template: 'public/about.html',
  //     filename: 'about.html'
  //   }
  // }
})