import { Canvas, useThree, useFrame } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import KeyboardModel from '../models/Keyboard';

// Map of keycap names to their languages (from your GLB file)
const KEYCAP_MAP = {
  // Exact names from your 3D model
  'Key-HTML5018': 'html5',
  'Key-CSS026': 'css',
  'Key-Github017': 'github',
  'Key-C011': 'c',
  'Key-Python022': 'python',
  'Key-Typescript028': 'typescript',
  'Key-React029': 'react',
  'Key-Java016': 'java',
  'Key-Unity019': 'unity',
  'Key-CSharp020': 'csharp',
  'Key-Javascript021': 'javascript',
  
  // Child meshes (in case raycasting hits these instead of parent)
  'Cube021_1': 'c',
  'Cube021_2': 'c',
  'Cube035_1': 'python',
  'Cube035_2': 'python',
};

function Controls({ onTouchStart, onTouchEnd }) {
  const controlsRef = useRef();
  const { camera, gl } = useThree();
  const lastTouchTime = useRef(0);

  useFrame(() => {
    if (controlsRef.current) {
      // Check if enough time has passed to resume auto-rotate
      const now = Date.now();
      if (lastTouchTime.current > 0 && now - lastTouchTime.current > 2000) {
        if (!controlsRef.current.autoRotate) {
          controlsRef.current.autoRotate = true;
          console.log('🔄 Auto-rotate RESUMED');
        }
        lastTouchTime.current = 0;
      }
    }
  });

  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    
    // Set up auto-rotate
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 60;

    console.log('✅ OrbitControls configured - Auto-rotate enabled');

    // Listen for touch events
    const handleStart = () => {
      controls.autoRotate = false;
      lastTouchTime.current = Date.now();
      console.log('✋ Touch detected - Auto-rotate STOPPED');
      if (onTouchStart) onTouchStart();
    };

    const handleEnd = () => {
      console.log('👉 Touch released - Auto-rotate will RESUME in 2 seconds');
      if (onTouchEnd) onTouchEnd();
    };

    gl.domElement.addEventListener('touchstart', handleStart);
    gl.domElement.addEventListener('touchend', handleEnd);

    return () => {
      gl.domElement.removeEventListener('touchstart', handleStart);
      gl.domElement.removeEventListener('touchend', handleEnd);
    };
  }, [gl, onTouchStart, onTouchEnd]);

  return (
    <orbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
    />
  );
}

function SceneContent({ setSceneReady, onTouchStart, onTouchEnd }) {
  const { camera, scene, gl } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());

  useEffect(() => {
    camera.position.set(20, 30, 25);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    if (setSceneReady) {
      setSceneReady({ 
        camera, 
        scene, 
        gl, 
        raycaster: raycasterRef.current, 
        pointer: pointerRef.current 
      });
    }
  }, [camera, scene, gl, setSceneReady]);

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, 10, 10]} intensity={1.5} />
      <directionalLight position={[0, -5, 10]} intensity={1.2} />

      <Suspense fallback={null}>
        <KeyboardModel />
      </Suspense>

      <Controls onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} />
    </>
  );
}

export default function KeyboardScene({ onKeyPress }) {
  const sceneDataRef = useRef(null);
  const lastTapTime = useRef(0);

  const handleKeyPress = (language) => {
    console.log('🎹 Key pressed:', language);
    if (onKeyPress) {
      onKeyPress(language);
    }
  };

  const handleSceneReady = (sceneData) => {
    sceneDataRef.current = sceneData;
  };

  // Single tap detection
  const handleTap = (e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    
    // Prevent accidental double taps
    if (timeSinceLastTap < 300) {
      console.log('⚠️ Double tap detected, ignoring');
      return;
    }
    
    lastTapTime.current = now;

    if (!sceneDataRef.current) {
      console.log('⚠️ Scene not ready yet');
      return;
    }

    const { camera, scene, gl, raycaster, pointer } = sceneDataRef.current;
    
    try {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      
      // Convert to normalized device coordinates
      pointer.x = ((e.x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.y - rect.top) / rect.height) * 2 + 1;

      console.log('👆 Tap at:', { x: e.x.toFixed(0), y: e.y.toFixed(0) });

      // Perform raycast
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      console.log(`🔍 Raycasting... found ${intersects.length} intersections`);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        console.log('🖱️ Clicked:', clickedObject.name || '(unnamed)');
        
        let foundLanguage = null;
        
        // Check direct name match
        if (KEYCAP_MAP[clickedObject.name]) {
          foundLanguage = KEYCAP_MAP[clickedObject.name];
        }

        // Check parent name if not found
        if (!foundLanguage && clickedObject.parent?.name) {
          console.log('🔍 Checking parent:', clickedObject.parent.name);
          if (KEYCAP_MAP[clickedObject.parent.name]) {
            foundLanguage = KEYCAP_MAP[clickedObject.parent.name];
          }
        }

        if (foundLanguage) {
          console.log('✅ Language detected:', foundLanguage);
          
          // Log which language key was pressed
          const languageNames = {
            'html5': 'HTML5',
            'css': 'CSS',
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
          
          console.log(`🎯 PRESSED: ${languageNames[foundLanguage] || foundLanguage.toUpperCase()}`);
          
          // Visual feedback
          if (clickedObject.material?.emissive) {
            const originalEmissive = clickedObject.material.emissive.getHex();
            clickedObject.material.emissive.setHex(0x4a9eff);
            setTimeout(() => {
              clickedObject.material.emissive.setHex(originalEmissive);
            }, 200);
          }
          
          handleKeyPress(foundLanguage);
        } else {
          console.log('⚠️ No mapping for:', clickedObject.name || '(unnamed mesh)');
        }
      } else {
        console.log('❌ No objects hit by raycast');
      }
    } catch (error) {
      console.error('❌ Click detection error:', error);
    }
  };

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(1)
    .onEnd(handleTap);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container}>
        <Canvas camera={{ position: [20, 30, 25], fov: 55 }}>
          <SceneContent setSceneReady={handleSceneReady} />
        </Canvas>
        
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>Pinch to zoom • Drag to rotate • Tap keys 🎹</Text>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a'
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#aaa',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
