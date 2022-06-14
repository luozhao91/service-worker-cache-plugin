/*
 * @Description: vite ServiceWorker 插件注册
 * @Author: Area
 * @Date: 2022-06-07 16:08:45
 */
import type { PluginOption } from 'vite';

import { createServiceWorkerCache } from './serviceWorker';

export function vitePluginServiceWorker(option: TSwOption): PluginOption {
  const swOptions: TSwOption = {};
  swOptions.name = option.name || 'sw';
  swOptions.hash = option.hash || '' + +new Date();
  swOptions.version = option.version || '';
  swOptions.excache = option.excache || null;
  swOptions.time = option.time || 10000;
  swOptions.filter = option.filter;

  return {
    // 插件名称
    name: 'service-worker-cache-plugin',
    // pre 会较于 post 先执行
    enforce: 'post', // post
    // 指明它们仅在 'build' 或 'serve' 模式时调用
    apply: 'build', // apply 亦可以是一个函数
    // 1. vite 独有的钩子：可以在 vite 被解析之前修改 vite 的相关配置。钩子接收原始用户配置 config 和一个描述配置环境的变量env
    config(config) {
      swOptions.publicPath = config.base;
    },
    // 输出阶段钩子通用钩子：在调用 bundle.write 之前立即触发这个hook
    async generateBundle(options, bundle, isWrite) {
      swOptions.hash = `${swOptions.hash}_${swOptions.version}`;
      bundle = await createServiceWorkerCache('vite', bundle, swOptions);
    },
  };
}
