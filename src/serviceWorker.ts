/*
 * @Description: 生成serviceWorker缓存，注册文件
 * @Author: Area
 * @Date: 2022-06-13 13:55:42
 */
import { minify } from 'terser';
import { REGISTER, SW } from './writeFile';
export async function createServiceWorkerCache(type: TPluginType, bundle, swOptions: TSwOption) {
  const { publicPath, hash, name: swName } = swOptions;
  const name = swName + '.js';
  const hashFileName = swName + '.hash';
  let cacheFiles: string[] = [];
  for (const key in bundle) {
    if (/\.html$/.test(key)) {
      let source = '';
      if (type === 'vite') {
        source = bundle[key]['source'];
      } else if (type === 'webpack') {
        source = bundle[key].source();
      }
      let swLinkJs = REGISTER as string;
      swLinkJs = swLinkJs.replace(`@@SW_JS_PATH@@`, name);
      swLinkJs = swLinkJs.replace(`@@SW_CACHE_HASH@@`, hash);
      const swLinkJsMin = await minify(swLinkJs);
      const html = source.replace(/(<\/head)/, `<script>${swLinkJsMin.code}</script>$1`);
      if (type === 'vite') {
        bundle[key]['source'] = html;
      } else if (type === 'webpack') {
        bundle[key] = {
          source() {
            return html;
          },
          size() {
            return html.length;
          },
        };
      }
    }

    if (!swOptions.excache) {
      cacheFiles.push(key);
    }
    // 文件名匹配 excache，匹配到的文件不缓存
    else if (!swOptions.excache.test(key)) {
      cacheFiles.push(key);
    }
  }
  // 加入过滤函数，方便自定义筛选规则
  if (swOptions.filter) {
    cacheFiles = swOptions.filter(cacheFiles, bundle);
  }
  let swJs = SW as string;
  swJs = swJs.replace(`@@SW_CACHE_HASH@@`, `${hash}`);
  swJs = swJs.replace(`@@SW_CACHE_FILES@@`, `${JSON.stringify(cacheFiles)}`);
  swJs = swJs.replace(`@@SW_JS_NAME@@`, name);
  swJs = swJs.replace(`@@CDN_URL@@`, publicPath);
  swJs = swJs.replace(`@@SW_HASH_FILE_PATH@@`, hashFileName);
  swJs = swJs.replace(`@@SW_EFFECTIVE_TIME@@`, '' + swOptions.time);
  const swJsMin = await minify(swJs);
  const swCode = swJsMin.code as string | Uint8Array;

  if (type === 'vite') {
    bundle[name] = {
      fileName: name,
      isAsset: true,
      name: name,
      source: swCode,
      type: 'asset',
    };
    bundle[hashFileName] = {
      fileName: hashFileName,
      isAsset: true,
      name: hashFileName,
      source: `${hash}`,
      type: 'asset',
    };
  } else if (type === 'webpack') {
    bundle[name] = {
      source() {
        return swCode;
      },
      size() {
        return swCode.length;
      },
    };
    const swHashJs = `${hash}`;
    bundle[hashFileName] = {
      source() {
        return swHashJs;
      },
      size() {
        return swHashJs.length;
      },
    };
  }
  return bundle;
}
