// utils/preloader.js
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

/**
 * Create a texture from an asset URI (React Native / Expo compatible)
 * This bypasses the DOM-dependent THREE.TextureLoader
 */
function createTextureFromURI(uri) {
  const texture = new THREE.Texture();
  
  // In React Native, we need to handle the image differently
  // The texture will be properly loaded by @react-three/fiber when used
  texture.image = { src: uri };
  texture.needsUpdate = true;
  
  // Optimize for mobile
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = false;
  
  return texture;
}

/**
 * Preload logo textures for the floating icons
 * Returns URIs that will be used by @react-three/fiber's texture system
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

    console.log(`✅ Loaded ${logoAssets.length} logo assets`);
    
    onProgress?.('loading', 50, 'Processing textures');

    // Store URIs for use in the scene
    // @react-three/fiber will handle actual texture loading
    global.logoTextureURIs = {
      javascript: logoAssets[0].localUri || logoAssets[0].uri,
      css: logoAssets[1].localUri || logoAssets[1].uri,
      python: logoAssets[2].localUri || logoAssets[2].uri,
      github: logoAssets[3].localUri || logoAssets[3].uri,
    };

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 Logo textures preloaded in ${totalTime}s`);
    console.log('Texture URIs:', global.logoTextureURIs);
    onProgress?.('complete', 100, 'Logos ready');

    return global.logoTextureURIs;
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

    // Step 5: CLONE during loading screen
    const meshCount = countMeshes(gltf.scene);
    const materialCount = countMaterials(gltf.scene);
    
    onProgress?.('cloning', 0, `Cloning model (${meshCount} meshes, ${materialCount} materials)`);
    console.log('🔄 Cloning model for scene use (this may take 10-15s)...');
    
    const cloneStart = Date.now();
    
    // Progress simulator
    let cloneProgress = 0;
    const progressInterval = setInterval(() => {
      cloneProgress = Math.min(cloneProgress + 5, 90);
      onProgress?.('cloning', cloneProgress, 'Cloning in progress...');
    }, 500);
    
    global.keyboardModelCloned = gltf.scene.clone();
    
    clearInterval(progressInterval);
    const cloneTime = ((Date.now() - cloneStart) / 1000).toFixed(2);
    console.log(`✅ Model cloned in ${cloneTime}s`);
    onProgress?.('cloning', 100, `Cloned in ${cloneTime}s`);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🎉 TOTAL PRELOAD TIME: ${totalTime}s`);
    
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
 * Clean up preloaded assets
 */
export function cleanupKeyboardModel() {
  // Dispose model
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
  global.logoTextureURIs = null;
  
  console.log('🧹 All assets cleaned up');
}
