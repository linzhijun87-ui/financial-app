// Service Worker for Financial Masterplan PRO
const APP_VERSION = '1.0.3'; // Update version jika ada perubahan
const CACHE_NAME = `financial-masterplan-${APP_VERSION}`;
const CACHE_FILES = [
  '/financial-app/', // Root
  '/financial-app/index.html',
  '/financial-app/style.css',
  '/financial-app/script-fixed.js',
  '/financial-app/manifest.json',
  '/financial-app/firebase-config.js',
  '/financial-app/icons/icon-192x192.png',
  '/financial-app/icons/icon-512x512.png',
  '/financial-app/icons/favicon.ico'
];

// External resources to cache (optional)
const EXTERNAL_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

// Install - Cache semua file
self.addEventListener('install', event => {
  console.log(`🛠️ Service Worker ${APP_VERSION} installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell...');
        // Cache local files
        return cache.addAll(CACHE_FILES)
          .then(() => {
            console.log('✅ App shell cached');
            // Cache external resources (non-blocking)
            return Promise.all(
              EXTERNAL_RESOURCES.map(url => 
                fetch(url).then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                }).catch(err => {
                  console.log(`⚠️ Failed to cache ${url}:`, err);
                })
              )
            );
          });
      })
      .then(() => {
        console.log('🚀 All resources cached');
        return self.skipWaiting(); // Activate immediately
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
          // Delete old caches (except current)
          if (cacheName !== CACHE_NAME && cacheName.startsWith('financial-masterplan-')) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Claim all clients
      return self.clients.claim();
    })
    .then(() => {
      console.log('✅ Service Worker ready!');
    })
  );
});

// Fetch - Smart strategy
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip browser extensions and chrome:// URLs
  if (url.protocol === 'chrome-extension:') return;
  
  // Skip Firebase and external APIs (cache separately)
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore')) {
    return; // Let browser handle
  }
  
  // For HTML pages: Network First, then Cache
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Update cache with fresh version
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseClone))
              .catch(err => console.log('Cache update error:', err));
          }
          return response;
        })
        .catch(() => {
          // Offline: return from cache
          return caches.match(request)
            .then(cachedResponse => cachedResponse || 
              caches.match('/financial-app/index.html'));
        })
    );
    return;
  }
  
  // For static assets (CSS, JS, images): Cache First
  if (request.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached, but fetch update in background
            fetch(request).then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, response));
              }
            }).catch(() => {}); // Silent fail
            return cachedResponse;
          }
          // Not in cache, fetch and cache
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(err => {
              console.log('Fetch failed:', err);
              // Return offline placeholder for images
              if (request.url.match(/\.(png|jpg|jpeg|gif|ico|svg)$/)) {
                return caches.match('/financial-app/icons/icon-192x192.png');
              }
              throw err;
            });
        })
    );
    return;
  }
  
  // Default: Network First for API calls
  event.respondWith(
    fetch(request)
      .catch(() => {
        // If network fails, try cache for JSON
        if (request.url.match(/\.json$/)) {
          return caches.match(request);
        }
        throw new Error('Offline');
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-financial-data') {
    console.log('🔄 Background sync triggered:', event.tag);
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data function
async function syncPendingData() {
  try {
    // Get pending data from IndexedDB or localStorage
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      console.log(`🔄 Syncing ${pendingData.length} pending items...`);
      
      // Sync with server (Firebase)
      const results = await Promise.all(
        pendingData.map(item => syncWithServer(item))
      );
      
      // Remove synced items
      await clearSyncedData(results.filter(r => r.success));
      
      console.log('✅ Background sync completed');
      
      // Show notification
      self.registration.showNotification('Financial Masterplan', {
        body: `Synced ${results.filter(r => r.success).length} items`,
        icon: '/financial-app/icons/icon-192x192.png',
        tag: 'sync-complete'
      });
    }
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Helper functions
async function getPendingData() {
  // Implement: Get data from localStorage or IndexedDB
  const pending = localStorage.getItem('pending_sync');
  return pending ? JSON.parse(pending) : [];
}

async function syncWithServer(data) {
  // Implement: Sync with Firebase/backend
  return { success: true, id: data.id };
}

async function clearSyncedData(syncedItems) {
  // Implement: Remove synced items from pending
  const pending = await getPendingData();
  const newPending = pending.filter(item => 
    !syncedItems.some(synced => synced.id === item.id)
  );
  localStorage.setItem('pending_sync', JSON.stringify(newPending));
}

// Push notifications
self.addEventListener('push', event => {
  console.log('📱 Push notification received');
  
  let data = {
    title: 'Financial Masterplan',
    body: 'Update your financial progress!',
    icon: '/financial-app/icons/icon-192x192.png',
    badge: '/financial-app/icons/badge-72x72.png',
    tag: 'financial-update'
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: '/financial-app/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '📊 Open Dashboard' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Focus existing window
          for (const client of clientList) {
            if (client.url.includes('/financial-app/') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/financial-app/');
          }
        })
    );
  }
});

// Periodic sync (for regular updates)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-financial-data') {
    console.log('🔄 Periodic sync triggered');
    event.waitUntil(updateCachedData());
  }
});

async function updateCachedData() {
  // Update cached data periodically
  console.log('Updating cached data...');
}

// Handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_DATA') {
    caches.open(CACHE_NAME)
      .then(cache => cache.put(event.data.url, event.data.response));
  }
});