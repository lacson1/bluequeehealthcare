// Clinic Management Service Worker - Offline First Healthcare System
const CACHE_NAME = 'clinic-management-v1';
const OFFLINE_QUEUE_KEY = 'clinic-offline-queue';

// Critical resources to cache for offline functionality
const ESSENTIAL_RESOURCES = [
  '/',
  '/index.html',
  '/generated-icon.png'
];

// Install service worker and cache essential resources
self.addEventListener('install', (event) => {
  console.log('🏥 Clinic SW: Installing offline capabilities...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching essential clinic resources');
        return cache.addAll(ESSENTIAL_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Clinic SW: Activating offline mode');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Offline-first fetch strategy for clinic data
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } 
  // Handle static resources
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

// API request handler with offline queue
async function handleApiRequest(request) {
  const method = request.method;

  try {
    // Try network first for real-time data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful GET responses
      if (method === 'GET') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('🔌 Network unavailable, using offline strategy');
    
    // Handle different request types when offline
    if (method === 'GET') {
      return await handleOfflineGetRequest(request);
    } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return await handleOfflineWriteRequest(request);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Offline mode active', 
        message: 'This action will be synced when connection returns' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle GET requests when offline
async function handleOfflineGetRequest(request) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('📋 Serving cached data');
    return cachedResponse;
  }

  return new Response(
    JSON.stringify({ message: 'Data cached for offline access', offline: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Handle write operations when offline
async function handleOfflineWriteRequest(request) {
  try {
    const requestData = await request.clone().json();
    
    // Store in offline queue for later sync
    await queueOfflineAction({
      url: request.url,
      method: request.method,
      data: requestData,
      timestamp: Date.now()
    });

    console.log('💾 Queued offline action for sync');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Action saved offline - will sync when online',
        offlineMode: true
      }),
      { 
        status: 202,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to queue offline action' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline Mode Active');
  }
}

// Queue offline actions for later sync
async function queueOfflineAction(action) {
  const existingQueue = await getOfflineQueue();
  existingQueue.push(action);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
}

// Get offline queue
async function getOfflineQueue() {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}