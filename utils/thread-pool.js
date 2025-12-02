// thread-pool.js - Complete implementation with analytics
import { ThreadPool } from 'react-native-multithreading';

export const initializeThreadPool = async () => {
  try {
    // Initialize 3-thread pool (Main thread is always JS thread)
    // Thread 1: Main JS/UI (automatic)
    // Thread 2: Heavy computations
    // Thread 3: Data processing
    // Thread 4: Background tasks
    // Note: Three.js/WebGL automatically uses GPU, not these threads
    
    global.threadPool = new ThreadPool(3);
    
    const warmupTasks = [
      global.threadPool.execute(() => 'Worker 1 ready'),
      global.threadPool.execute(() => 'Worker 2 ready'),
      global.threadPool.execute(() => 'Worker 3 ready'),
    ];
    
    await Promise.all(warmupTasks);
    console.log('✅ Thread pool initialized with 3 worker threads');
    return true;
  } catch (error) {
    console.warn('Thread pool initialization failed:', error);
    global.threadPool = null;
    return false;
  }
};

/**
 * Log analytics events in background thread
 * This prevents analytics from blocking the UI
 * 
 * @param {Object} eventData - Event data to log
 * @returns {Promise<void>}
 */
export const logAnalytics = async (eventData) => {
  // If thread pool isn't available, just log to console
  if (!global.threadPool) {
    console.log('📊 Analytics (no thread pool):', eventData);
    return;
  }
  
  try {
    // Execute analytics processing in background thread
    await global.threadPool.execute(() => {
      // This runs in a worker thread (off main UI thread)
      const timestamp = Date.now();
      const processed = {
        ...eventData,
        timestamp,
        processed: true,
      };
      
      // In a real app, you'd send this to your analytics service
      // For now, just return the processed data
      return processed;
    });
    
    // Optional: log to console on main thread
    // console.log('📊 Analytics logged:', eventData.event);
  } catch (error) {
    console.warn('Analytics logging failed:', error);
  }
};

// Worker functions that CAN run in background threads
// These must be pure functions with no external dependencies

/**
 * Perform heavy raycast calculations in background
 * (This is a simplified example - real raycasting needs Three.js)
 */
export const raycastCalculations = (pointer, cameraMatrix, objects) => {
  const results = [];
  
  for (const obj of objects) {
    // Perform heavy math calculations here
    const distance = Math.sqrt(
      Math.pow(obj.position.x - pointer.x, 2) +
      Math.pow(obj.position.y - pointer.y, 2) +
      Math.pow(obj.position.z - pointer.z, 2)
    );
    
    if (distance < obj.boundingRadius) {
      results.push({ id: obj.id, distance });
    }
  }
  
  return results.sort((a, b) => a.distance - b.distance);
};

/**
 * Process model data in background thread
 */
export const processModelData = (modelData) => {
  const processed = {
    vertexCount: modelData.vertices?.length || 0,
    faceCount: modelData.faces?.length || 0,
    bounds: calculateBounds(modelData.vertices),
  };
  return processed;
};

// Helper functions
const calculateBounds = (vertices) => {
  if (!vertices?.length) return { min: [0,0,0], max: [0,0,0] };
  
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    minZ = Math.min(minZ, v.z);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
    maxZ = Math.max(maxZ, v.z);
  }
  
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
};
