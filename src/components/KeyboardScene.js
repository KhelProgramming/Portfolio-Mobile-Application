import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as THREE from 'three';

// Camera positions (that's it!)
const CAMERA_STATES = {
  ZOOMED_OUT: {
    position: new THREE.Vector3(20, 30, 25),
    lookAt: new THREE.Vector3(0, 0, 0),
  },
  ZOOMED_IN: {
    position: new THREE.Vector3(0, 20, 18),
    lookAt: new THREE.Vector3(-100, 2, -2),
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
// SIMPLE CAMERA - No bullshit
// ============================================
function CameraController({ isZoomedIn }) {
  const { camera } = useThree();
  
  // Spring physics state
  const velocity = useRef(new THREE.Vector3());
  const currentTarget = useRef(CAMERA_STATES.ZOOMED_OUT.position.clone());
  const autoRotateAngle = useRef(0);
  const lastZoomState = useRef(isZoomedIn);
  
  useEffect(() => {
    camera.position.copy(CAMERA_STATES.ZOOMED_OUT.position);
  }, [camera]);

  useFrame((state, delta) => {
    // CRITICAL FIX: When zoom state changes, boost velocity for instant response
    if (lastZoomState.current !== isZoomedIn) {
      lastZoomState.current = isZoomedIn;
      
      // Give it a velocity KICK toward the new target
      const newTarget = isZoomedIn ? CAMERA_STATES.ZOOMED_IN.position : CAMERA_STATES.ZOOMED_OUT.position;
      const direction = new THREE.Vector3().subVectors(newTarget, camera.position).normalize();
      velocity.current.copy(direction.multiplyScalar(15)); // Instant boost!
      
      console.log(`🚀 Zoom ${isZoomedIn ? 'IN' : 'OUT'} - velocity boosted!`);
    }
    
    // Determine target based on zoom state
    let targetPos;
    let targetLookAt = new THREE.Vector3(0, 0, 0);
    
    if (isZoomedIn) {
      // Zoomed in - static position
      targetPos = CAMERA_STATES.ZOOMED_IN.position;
    } else {
      // Zoomed out - auto-rotate
      autoRotateAngle.current += delta * 0.3;
      const radius = 35;
      targetPos = new THREE.Vector3(
        Math.sin(autoRotateAngle.current) * radius,
        30,
        Math.cos(autoRotateAngle.current) * radius
      );
    }
    
    // Spring physics (simple and fast)
    const stiffness = 10.0; // Snappy!
    const damping = 0.8;    // Smooth!
    
    const displacement = new THREE.Vector3().subVectors(targetPos, camera.position);
    const force = displacement.multiplyScalar(stiffness);
    const dampingForce = velocity.current.clone().multiplyScalar(-damping);
    
    velocity.current.add(force.add(dampingForce).multiplyScalar(delta));
    camera.position.add(velocity.current.clone().multiplyScalar(delta));
    camera.lookAt(targetLookAt);
  });

  return null;
}

// ============================================
// SCENE CONTENT - Load once, render forever
// ============================================
function SceneContent({ isZoomedIn, onReady }) {
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
      <CameraController isZoomedIn={isZoomedIn} />
    </>
  );
}

// ============================================
// MAIN COMPONENT - Clean and simple
// ============================================
export default function KeyboardScene({ onKeyPress }) {
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Ready');
  
  const sceneRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster()).current;

  // Raycast for keycap detection
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
        
        // Visual feedback
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
    setIsZoomedIn(prev => !prev);
  }, []);

  const handleCanvasTap = useCallback((event) => {
    if (!isZoomedIn) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const language = performRaycast(locationX, locationY);
    
    if (language) {
      onKeyPress?.(language);
    }
  }, [isZoomedIn, performRaycast, onKeyPress]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.canvas} onPress={handleCanvasTap}>
        <Canvas 
          camera={{ position: [20, 30, 25], fov: 55 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ flex: 1 }}
        >
          <SceneContent 
            isZoomedIn={isZoomedIn}
            onReady={handleSceneReady}
          />
        </Canvas>
      </Pressable>
      
      <View style={styles.debugPanel} pointerEvents="none">
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>

      <Pressable style={styles.zoomButton} onPress={handleZoomToggle}>
        <Text style={styles.zoomButtonText}>
          {isZoomedIn ? 'ZOOM OUT' : 'TAP HERE'}
        </Text>
      </Pressable>

      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>
          {isZoomedIn ? 'Tap keys to select 🎹' : 'Explore the keyboard 👆'}
        </Text>
      </View>

      <View style={styles.indicator} pointerEvents="none">
        <Text style={styles.indicatorText}>
          {isZoomedIn ? '🔍 ZOOMED' : '🌐 ROTATING'}
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