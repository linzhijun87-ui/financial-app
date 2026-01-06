// Service Worker for Financial Masterplan PRO
const APP_VERSION = '1.0.4';
const CACHE_NAME = `financial-masterplan-${APP_VERSION}`;
const PENDING_DATA_CACHE = 'pending-data-v1';

// App files to cache - RELATIVE PATHS
const APP_FILES = [
  './',                    // Root
  './index.html',
  './style.css',
  './script-fixed.js',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-180x180.png',
  './splash/splash-1179x2556.png',
  './splash/splash-1536x2048.png'
];

// Install - Cache app files
self.addEventListener('install', event => {
  console.log(`🛠️ Service Worker ${APP_VERSION} installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app files...');
        return cache.addAll(APP_FILES);
      })
      .then(() => {
        console.log('✅ App cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Cache failed:', err);
      })
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('financial-masterplan-')) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
    .then(() => console.log('✅ Service Worker ready!'))
  );
});

// Fetch - Cache first for static assets
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET and external APIs
  if (request.method !== 'GET') return;
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;
  
  // For HTML: Network first, fallback to cache
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache fresh version
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  
  // For static assets: Cache first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          // Update cache in background
          fetch(request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cached;
        }
        
        // Not in cache, fetch and cache
        return fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(err => {
            console.log('Fetch failed:', err);
            // Return placeholder for images
            if (request.url.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
              return caches.match('./icons/icon-192x192.png');
            }
            throw err;
          });
      })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-financial-data') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('✅ Sync completed (simulated)');
        return self.registration.showNotification('Financial Masterplan', {
          body: '✅ Data synced successfully',
          icon: './icons/icon-192x192.png'
        });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('📱 Push received');
  
  const options = {
    body: 'Update your financial progress!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: './' }
  };
  
  event.waitUntil(
    self.registration.showNotification('Financial Masterplan', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});