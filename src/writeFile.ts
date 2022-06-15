/*
 * @Description: 写入文件模板
 * @Author: Area
 * @Date: 2022-06-10 15:29:59
 */
export const REGISTER = `
window.SW_CACHE_HASH = '@@SW_CACHE_HASH@@';

(function () {
  if ('serviceWorker' in navigator) {
    document.onreadystatechange = function () {
      if (
        document.readyState === 'interactive' &&
        navigator.serviceWorker.controller
      ) {
        navigator.serviceWorker.controller.postMessage({
          type: 'openPage',
          hash: window.SW_CACHE_HASH,
        });
      }
    };

    navigator.serviceWorker
      .register('@@SW_JS_PATH@@', { scope: './' })
      .then(function () {

        navigator.serviceWorker.addEventListener('message', function (event) {
          const data = event.data || {};

          if (data.type === 'swReload') {
            window.location.reload();
          } else if (data.type === 'swHash') {
            navigator.serviceWorker.controller.postMessage({
              type: 'swHash',
              hash: window.SW_CACHE_HASH,
            });
          }
        });
      })
      .catch(function (err) {
        console.log('Service Worker 注册失败', err);
        navigator.serviceWorker
          .getRegistrations()
          .then(function (registrations) {
            for (let i = 0; i < registrations.length; i++) {
              registrations[i].unregister();
            }
          });
      });
  } else {
    console.log('不支持 Service Worker ');
  }
})();
`;

export const SW = `
const SW_CACHE_HASH = '@@SW_CACHE_HASH@@';
const SW_JS_NAME = '@@SW_JS_NAME@@';
const ASSET_PUBLIC_URL = self.serviceWorker.scriptURL.replace(SW_JS_NAME, '');
const CDN_URL = '@@CDN_URL@@';
const SW_CACHE_FILES = JSON.parse('@@SW_CACHE_FILES@@');
let updateTime = 0;
const effectiveTime = '@@SW_EFFECTIVE_TIME@@';
let nowClientId = '';
let swRespond = false;
const verifyHash = function () {
  if (Date.now() - updateTime < Number(effectiveTime)) return;
  updateTime = Date.now();
  fetch(ASSET_PUBLIC_URL + '@@SW_HASH_FILE_PATH@@', {
    headers: {
      SW_NO_CACHE: 'true',
      'Cache-Control': 'no-cache',
      Expires: 0,
    },
  })
    .then(function (res) {
      return res.blob();
    })
    .then(function (blob) {
      const render = new FileReader();
      render.readAsText(blob, 'utf8');
      render.onload = function () {
        const hash = render.result;
        if (!hash || SW_CACHE_HASH !== hash) {
          caches.delete(SW_CACHE_HASH).then(function () {
            self.registration.unregister().then(function () {
              self.clients.get(nowClientId).then(function (client) {
                client.postMessage({
                  type: 'swReload',
                  hash: '',
                });
              });
            });
          });
        } else {
          if (nowClientId) {
            self.clients.get(nowClientId).then(function (client) {
              waitPageRespond();
              client.postMessage({
                type: 'swHash',
                hash: SW_CACHE_HASH,
              });
            });
          }
        }
      };
    })
    .catch(function (err) {
      if (err.message === 'Failed to fetch') {
        self.registration.unregister();
        if (self.navigator.onLine) {
          caches.delete(SW_CACHE_HASH);
        }
      }
    });
};

const waitPageRespond = function () {
  swRespond = true;
  setTimeout(function () {
    if (swRespond) {
      caches.delete(SW_CACHE_HASH).then(function () {
        self.registration.unregister();
      });
    }
  }, 500);
};

self.addEventListener('install', function () {
  self.skipWaiting();

});

/* 当此 sw.js 激活时触发 */
self.addEventListener('activate', function (evt) {
  evt.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return cacheName != SW_CACHE_HASH;
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          }),
      );
    }),
  );

});

self.addEventListener('message', function (evt) {
  const data = evt.data || {};
  nowClientId = evt.source.id;

  if (data.type === 'openPage') {
    verifyHash();
  }
  else if (data.type === 'swHash') {
    swRespond = false;
    if (data.hash !== SW_CACHE_HASH) {
      caches.delete(SW_CACHE_HASH).then(function () {
        self.registration.unregister();
      });
    }
  }
});

/* 拦截浏览器发出的的请求文件申请，根据条件判断返回缓存文件还是进行网络请求 */
self.addEventListener('fetch', function (evt) {
  const clientId = evt.clientId || evt.resultingClientId;

  if (clientId !== nowClientId) {
    nowClientId = clientId;
    setTimeout(function () {
      verifyHash();
    }, 500);
  }

  evt.respondWith(
    caches.match(evt.request).then(function (response) {
      const SW_NO_CACHE = evt.request.headers.get('SW_NO_CACHE');
      let contentType = '';
      if (response && SW_NO_CACHE !== 'true') {
        return response;
      }
      return fetch(evt.request).then(function (res) {
        const url = res.url || '';
        const LastModified = res.headers.get('Last-Modified'); // 一般返回文件才有 LastModified
        contentType = res.headers.get('Content-Type') || '';
        if (evt.request.method === 'GET') {
          const ext = url.split('.').pop();
          let cache = false;
          if (contentType.indexOf('text/html') >= 0 && /\\/[^.]+$/.test(url)) {
            cache = true;
          }
          // 其它文件需要匹配 SW_CACHE_FILES 中的路径决定是否缓存
          else if (LastModified) {
            cache = SW_CACHE_FILES.includes(url.replace(CDN_URL.indexOf('http') >= 0 ? CDN_URL : ASSET_PUBLIC_URL, ''));
            if (cache) {
              if (
                ext === 'js' &&
                !contentType.includes('application/javascript')
              ) {
                cache = false;
              } else if (ext === 'css' && !contentType.includes('text/css')) {
                cache = false;
              }
            }
          }
          if (cache) {
            caches.open(SW_CACHE_HASH).then(function (cache) {
              cache.put(evt.request, res);
            });
          }
        }
        return res.clone();
      });
    }),
  );
});

`;
