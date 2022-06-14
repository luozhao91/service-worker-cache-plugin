/*
 * @Description: 类型
 * @Author: Area
 * @Date: 2022-06-13 14:29:15
 */
/**
 * sw插件可配置参数
 */
type TSwOption = {
  // 缓存sw文件名称
  name?: string;
  hash?: string;
  version?: string;
  // 此正则匹配到的文件，不进行缓存
  excache?: any;
  // 有效时间，在此时间内不检查更新。防止用户清除 SW_CACHE_HASH 导致页面无限刷新，默认 10000ms
  time?: number;
  // 提供自定义过滤方法
  filter?: any;
  // 插件生成资源公共目录
  publicPath?: string;
};

/**
 * 插件支持的打包工具类型，目前只支持vite 和 webpack
 */
type TPluginType = 'vite' | 'webpack';
