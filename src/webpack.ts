/*
 * @Description: webpack ServiceWorker 插件注册
 * @Author: luozhao
 * @Date: 2022-06-06 14:58:31
 */

import { createServiceWorkerCache } from './serviceWorker';
export class WebpackServiceWorkerPlugin {
  public options: TSwOption;
  constructor(swOptions: TSwOption) {
    this.options = {
      name: swOptions.name || 'sw',
      version: swOptions.version || '',
      excache: swOptions.excache || null,
      time: swOptions.time || 1000 * 60 * 60,
      filter: swOptions.filter,
    };
  }

  apply(compiler) {
    const _That = this;
    // 监听 emit事件，进行sw文件的生成和 需缓存文件的收集
    compiler.plugin('emit', async (compilation, callback) => {
      _That.options.publicPath = compiler.options.output.publicPath;
      _That.options.hash = `${compilation.hash.substring(0, 8)}_${_That.options.version}`;
      compilation.assets = await createServiceWorkerCache('webpack', compilation.assets, _That.options);
      callback();
    });
  }
}
