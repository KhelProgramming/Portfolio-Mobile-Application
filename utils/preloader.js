// utils/preloader.js
import { Asset } from 'expo-asset';
import { GLTFLoader } from 'three-stdlib';

/**
 * Preload logo textures for the floating icons
 */
export async function preloadLogoTextures(onProgress) {
  try {
    console.log('🎨 Starting logo texture preload...');
    const startTime = Date.now();

    onProgress?.('loading', 0, 'Loading logo images');

    // Load all logo assets
    const logoAssets = await Asset.loadAsync([
      require('../assets/logos/javascript.png'),
      require('../assets/logos/css.png'),
      require('../assets/logos/python.png'),
      require('../assets/logos/github.png'),
    ]);

    console.log(`✅ Loaded ${logoAssets.length} logo textures`);
    
    // Store the URIs in global for easy access
    global.logoTextures = {
      javascript: logoAssets[0].localUri || logoAssets[0].uri,
      css: logoAssets[1].localUri || logoAssets[1].uri,
      python: logoAssets[2].localUri || logoAssets[2].uri,
      github: logoAssets[3].localUri || logoAssets[3].uri,
    };

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 Logo textures preloaded in ${totalTime}s`);
    onProgress?.('complete', 100, 'Logos ready');

    return global.logoTextures;
  } catch (error) {
    console.error('❌ Logo texture preload failed:', error);
    onProgress?.('error', 0, error.message);
    throw error;
  }
}

/**
 * Preload the keyboard model AND clone it during loading screen
 * This way the 10-15s clone happens when user expects to wait
 * 
 * @param {Function} onProgress - Callback for progress updates: (stage, percent, message) => void
 */
export async function preloadKeyboardModel(onProgress) {
  try {
    console.log('📦 Starting keyboard model preload...');
    const startTime = Date.now();

    // Step 1: Load the GLB file as an Expo Asset
    onProgress?.('loading', 0, 'Loading 3D model file');
    console.log('📂 Loading GLB asset...');
    const [asset] = await Asset.loadAsync(
      require('../assets/keyboard.glb')
    );
    
    // Ensure the asset is downloaded locally
    if (!asset.localUri) {
      console.log('⬇️ Downloading asset to local storage...');
      await asset.downloadAsync();
    }
    
    const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Asset loaded: ${asset.localUri}`);
    console.log(`   Load time: ${loadTime}s`);
    onProgress?.('loading', 100, 'File loaded');

    // Step 2: Fetch as ArrayBuffer using fetch() - works everywhere!
    onProgress?.('parsing', 0, 'Reading file data');
    console.log('📖 Fetching GLB as ArrayBuffer...');
    const fetchStart = Date.now();
    
    const response = await fetch(asset.localUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch asset: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    const fetchTime = ((Date.now() - fetchStart) / 1000).toFixed(2);
    console.log(`✅ File fetched in ${fetchTime}s (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);
    onProgress?.('parsing', 50, 'Parsing GLTF data');

    // Step 3: Parse with GLTFLoader using ArrayBuffer
    console.log('🎨 Parsing GLTF...');
    const parseStart = Date.now();
    
    const gltf = await new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      
      // Extract the directory path from the localUri
      // Example: file:///path/to/file.glb -> file:///path/to/
      let resourcePath = asset.localUri.substring(0, asset.localUri.lastIndexOf('/') + 1);
      
      // Ensure it ends with a slash for the loader
      if (!resourcePath.endsWith('/')) {
        resourcePath += '/';
      }
      
      console.log(`📂 Resource path: ${resourcePath}`);
      
      // Parse from ArrayBuffer with proper resource path
      loader.parse(
        arrayBuffer,
        resourcePath,
        (gltf) => {
          console.log(`✅ GLTF parsed successfully`);
          resolve(gltf);
        },
        (error) => {
          console.error('❌ GLTFLoader parse error:', error);
          console.error('Asset URI:', asset.localUri);
          console.error('Resource path:', resourcePath);
          reject(error);
        }
      );
    });
    
    const parseTime = ((Date.now() - parseStart) / 1000).toFixed(2);
    console.log(`✅ GLTF parsed in ${parseTime}s`);
    onProgress?.('parsing', 100, 'GLTF parsed');

    // Step 4: Store original model
    global.keyboardModel = gltf.scene;
    console.log(`✅ Original model stored in global.keyboardModel`);

    // Step 5: CLONE during loading screen (this is the 10-15s part)
    // We'll simulate progress since THREE.js doesn't provide clone callbacks
    const meshCount = countMeshes(gltf.scene);
    const materialCount = countMaterials(gltf.scene);
    
    onProgress?.('cloning', 0, `Cloning model (${meshCount} meshes, ${materialCount} materials)`);
    console.log('🔄 Cloning model for scene use (this may take 10-15s)...');
    console.log(`   Model has ${meshCount} meshes and ${materialCount} materials`);
    
    const cloneStart = Date.now();
    
    // Start a progress simulator (since clone doesn't give us real progress)
    let cloneProgress = 0;
    const progressInterval = setInterval(() => {
      cloneProgress = Math.min(cloneProgress + 5, 90); // Cap at 90% until done
      onProgress?.('cloning', cloneProgress, 'Cloning in progress...');
    }, 500);
    
    global.keyboardModelCloned = gltf.scene.clone();
    
    clearInterval(progressInterval);
    const cloneTime = ((Date.now() - cloneStart) / 1000).toFixed(2);
    console.log(`✅ Model cloned in ${cloneTime}s`);
    onProgress?.('cloning', 100, `Cloned in ${cloneTime}s`);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 TOTAL PRELOAD TIME: ${totalTime}s`);
    console.log(`   Breakdown:`);
    console.log(`   - Asset load: ${loadTime}s`);
    console.log(`   - Fetch file: ${fetchTime}s`);
    console.log(`   - Parse GLTF: ${parseTime}s`);
    console.log(`   - Clone model: ${cloneTime}s`);
    
    onProgress?.('complete', 100, 'All assets ready!');

    return {
      original: global.keyboardModel,
      cloned: global.keyboardModelCloned,
      timing: {
        load: loadTime,
        fetch: fetchTime,
        parse: parseTime,
        clone: cloneTime,
        total: totalTime,
      },
    };

  } catch (error) {
    console.error('❌ Keyboard model preload failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    onProgress?.('error', 0, error.message);
    throw error;
  }
}

/**
 * Helper to count meshes in a scene
 */
function countMeshes(object) {
  let count = 0;
  object.traverse((child) => {
    if (child.isMesh) count++;
  });
  return count;
}

/**
 * Helper to count unique materials in a scene
 */
function countMaterials(object) {
  const materials = new Set();
  object.traverse((child) => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => materials.add(mat.uuid));
      } else {
        materials.add(child.material.uuid);
      }
    }
  });
  return materials.size;
}

/**
 * Clean up preloaded assets (call this when unmounting the app)
 */
export function cleanupKeyboardModel() {
  if (global.keyboardModelCloned) {
    global.keyboardModelCloned.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    global.keyboardModelCloned = null;
  }
  
  global.keyboardModel = null;
  global.logoTextures = null;
  
  console.log('🧹 Keyboard model and logos cleaned up');
}
