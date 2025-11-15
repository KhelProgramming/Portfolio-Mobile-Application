import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';

// Camera positions
const CAMERA_STATES = {
  ZOOMED_OUT: {
    position: new THREE.Vector3(20, 30, 25),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  ZOOMED_IN: {
    position: new THREE.Vector3(0, 20, 18),
    lookAt: new THREE.Vector3(0, 0, 0),
  }
};

// Keycap mapping
const KEYCAP_MAP = {
  'Key-HTML5018': 'html5',
  'Key-CSS026': 'css5',
  'Key-Github017': 'github',
  'Key-C011': 'c',
  'Key-Python022': 'python',
  'Key-Typescript028': 'typescript',
  'Key-React029': 'react',
  'Key-Java016': 'java',
  'Key-Unity019': 'unity',
  'Key-CSharp020': 'csharp',
  'Key-Javascript021': 'javascript',
  'Cube021_1': 'c',
  'Cube021_2': 'c',
  'Cube035_1': 'python',
  'Cube035_2': 'python',
};

const languageNames = {
  'html5': 'HTML5',
  'css5': 'CSS',
  'github': 'GitHub',
  'c': 'C Language',
  'python': 'Python',
  'typescript': 'TypeScript',
  'react': 'React',
  'java': 'Java',
  'unity': 'Unity',
  'csharp': 'C#',
  'javascript': 'JavaScript',
};

// ============================================
// CAMERA - Uses ref, no React state!
// ============================================
function CameraController({ isZoomedInRef }) {
  const { camera } = useThree();
  
  const velocity = useRef(new THREE.Vector3());
  const autoRotateAngle = useRef(0);
  const lastZoomState = useRef(false);
  
  useEffect(() => {
    camera.position.copy(CAMERA_STATES.ZOOMED_OUT.position);
  }, [camera]);

  useFrame((state, delta) => {
    const isZoomedIn = isZoomedInRef.current;
    
    // Detect state change
    if (lastZoomState.current !== isZoomedIn) {
      console.log(`⏱️ [INSTANT] Zoom ${isZoomedIn ? 'IN' : 'OUT'} detected in useFrame`);
      lastZoomState.current = isZoomedIn;
      
      // Velocity kick
      const newTarget = isZoomedIn ? CAMERA_STATES.ZOOMED_IN.position : CAMERA_STATES.ZOOMED_OUT.position;
      const direction = new THREE.Vector3().subVectors(newTarget, camera.position).normalize();
      velocity.current.copy(direction.multiplyScalar(15));
    }
    
    // Determine target
    let targetPos;
    
    if (isZoomedIn) {
      targetPos = CAMERA_STATES.ZOOMED_IN.position;
    } else {
      autoRotateAngle.current += delta * 0.3;
      const radius = 35;
      targetPos = new THREE.Vector3(
        Math.sin(autoRotateAngle.current) * radius,
        30,
        Math.cos(autoRotateAngle.current) * radius
      );
    }
    
    // Spring physics
    const smoothing = 0.05; // Try values between 0.01 (slow) and 0.1 (fast)
    camera.position.lerp(targetPos, smoothing);
    camera.lookAt(new THREE.Vector3(-4, 2, -2));
  });

  return null;
}

// Scene setup
function SceneContent({ isZoomedInRef, onReady }) {
  const { camera, scene, gl } = useThree();
  const setupDone = useRef(false);

  useEffect(() => {
    if (setupDone.current || !global.keyboardModelCloned) return;
    
    scene.add(global.keyboardModelCloned);
    
    if (!global.clickableKeycaps) {
      const keycaps = [];
      global.keyboardModelCloned.traverse((child) => {
        if (child.isMesh && KEYCAP_MAP[child.name]) {
          keycaps.push(child);
        }
      });
      global.clickableKeycaps = keycaps;
    }
    
    setupDone.current = true;
    onReady?.({ camera, scene, gl });
  }, [camera, scene, gl, onReady]);

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, 10, 10]} intensity={1.5} />
      <directionalLight position={[0, -5, 10]} intensity={1.2} />
      <CameraController isZoomedInRef={isZoomedInRef} />
    </>
  );
}

// ============================================
// MAIN - Minimal React state!
// ============================================
export default function KeyboardScene({ onKeyPress }) {
  // USE REF INSTEAD OF STATE!
  const isZoomedInRef = useRef(false);
  const [debugInfo, setDebugInfo] = useState('Ready');
  
  // Refs for UI elements (manual updates)
  const buttonTextRef = useRef(null);
  const hintTextRef = useRef(null);
  const stateTextRef = useRef(null);
  
  const sceneRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster()).current;

  const performRaycast = useCallback((x, y) => {
    if (!sceneRef.current || !global.clickableKeycaps) return null;

    const { camera, gl } = sceneRef.current;
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    
    const pointer = new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(global.clickableKeycaps, false);

    if (intersects.length > 0) {
      const language = KEYCAP_MAP[intersects[0].object.name];
      if (language) {
        setDebugInfo(`Hit: ${languageNames[language]}`);
        
        const obj = intersects[0].object;
        if (obj.material?.emissive) {
          const orig = obj.material.emissive.getHex();
          obj.material.emissive.setHex(0x4a9eff);
          setTimeout(() => obj.material.emissive?.setHex(orig), 200);
        }
        
        return language;
      }
    }
    return null;
  }, [raycaster]);

  const handleSceneReady = useCallback((sceneData) => {
    sceneRef.current = sceneData;
    setDebugInfo('✅ Ready');
  }, []);

  const handleZoomToggle = useCallback(() => {
    console.log('⏱️ [0ms] Button tap - updating ref directly');
    const t0 = Date.now();
    
    // UPDATE REF DIRECTLY (no React re-render!)
    isZoomedInRef.current = !isZoomedInRef.current;
    const newState = isZoomedInRef.current;
    
    // Manually update UI elements
    if (buttonTextRef.current) {
      buttonTextRef.current.setNativeProps({ 
        text: newState ? 'ZOOM OUT' : 'TAP HERE' 
      });
    }
    if (hintTextRef.current) {
      hintTextRef.current.setNativeProps({ 
        text: newState ? 'Tap keys to select 🎹' : 'Explore the keyboard 👆' 
      });
    }
    if (stateTextRef.current) {
      stateTextRef.current.setNativeProps({ 
        text: newState ? '🔍 ZOOMED' : '🌐 ROTATING' 
      });
    }
    
    const t1 = Date.now();
    console.log(`⏱️ [${t1 - t0}ms] Ref + UI updated (NO React re-render!)`);
  }, []);

  const handleCanvasTap = useCallback((event) => {
    const { locationX, locationY } = event.nativeEvent;
    const language = performRaycast(locationX, locationY);
    
    if (language) {
      onKeyPress?.(language);
    }
  }, [performRaycast, onKeyPress]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.canvas} onPress={handleCanvasTap}>
        <Canvas 
          camera={{ position: [20, 30, 25], fov: 55 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ flex: 1 }}
        >
          <SceneContent 
            isZoomedInRef={isZoomedInRef}
            onReady={handleSceneReady}
          />
        </Canvas>
      </Pressable>
      
      <Pressable style={styles.zoomButton} onPress={handleZoomToggle}>
        <Text ref={buttonTextRef} style={styles.zoomButtonText}>
          TAP HERE
        </Text>
      </Pressable>

      <View style={styles.indicator} pointerEvents="none">
        <Text ref={stateTextRef} style={styles.indicatorText}>
          🌐 ROTATING
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  canvas: {
    flex: 1,
  },
  debugPanel: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
  },
  zoomButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#666',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  indicator: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  indicatorText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});