<!--
 * @Description: README
 * @Author: Area
 * @Date: 2022-06-14 10:19:46
-->
# service-worker-cache-plugin
A plugin for loading assets by service-worker

## 插件介绍
1. 在打包时自动生成并插入 Service Worker 文件，目前支持 webpack 和 vite 打包使用
2. 服务部署后，进入网站会自动安装 Service Worker，并按需离线缓存项目静态资源文件，更新后会根据sw.hash hash的变动 删除缓存加载新资源
3. Service Worker 在 localhost 和 https(服务部署) 生效

## 插件使用
```
安装插件: yarn/npm/pnpm等包管理工具都可

pnpm i service-worker-cache-plugin --dev

配置:
    name: service-worker文件名称
    version: 版本号
    excache: 不进行缓存文件类型正则
    filter: 自定义缓存文件，(cacheFiles, bundle) (缓存文件key集合, 所有打包资源数据键值对)
所有配置均为可选

vite:
vite.config.ts/js 插件引用即可
import { vitePluginServiceWorker } from 'service-worker-cache-plugin';
...
 plugins: [
    ...
    vitePluginServiceWorker({
      name: 'sw',
      // 版本号
      version: '1.0.0',
      // 匹配文件名，成功则不进行离线缓存
      excache: /(\.map$|\.mp4$|\.png$|\.jpg$|\.jpeg$|\.svg$)/,
      filter: (cacheFiles) => {
        return cacheFiles.filter((o) => {
          return o.indexOf('.ico') === -1;
        });
      },
    }),
    ...
  ],
...

webpack:
已vue(vue-cli构建)项目为例:
const { WebpackServiceWorkerPlugin } = require('service-worker-cache-plugin');

configureWebpack: config => {
    const plugins = [
    ];
    if (IS_PROD) {
      plugins.push(
        new WebpackServiceWorkerPlugin({
          // service worker 文件名称
          name: 'sw',
          // 版本号
          version: '1.0.0',
          // 匹配文件名，成功不进行离线缓存
          excache: /(\.map$|\.mp4$|\.png$|\.jpg$|\.jpeg$|\.svg$\.ico$)/,
          // 对缓存文件进行过滤
          filter: cacheFiles => {
            return cacheFiles.filter(o => {
              return o.indexOf('.ico') === -1;
            });
          },
        })
      );
    }
    config.plugins = [...config.plugins, ...plugins];
  },
```
