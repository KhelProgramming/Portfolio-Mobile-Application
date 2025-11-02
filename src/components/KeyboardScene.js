import { Canvas, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef } from 'react';
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

function SceneContent({ setSceneReady }) {
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
    </>
  );
}

export default function KeyboardScene({ onKeyPress }) {
  const [OrbitControls, events] = useControls();
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

  // Tap gesture - separate from controls
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .numberOfTaps(1)
    .onEnd(handleTap);

  return (
    <View style={styles.container}>
      {/* OrbitControls gesture layer */}
      <View {...events} style={StyleSheet.absoluteFill}>
        <Canvas camera={{ position: [20, 30, 25], fov: 55 }}>
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.8}
            enableZoom={true}
            zoomSpeed={0.8}
            minDistance={8}
            maxDistance={60}
            enablePan={false}
            autoRotate={true}
            autoRotateSpeed={1.5}
          />
          <SceneContent setSceneReady={handleSceneReady} />
        </Canvas>
      </View>

      {/* Tap gesture layer on top */}
      <GestureDetector gesture={tapGesture}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
      </GestureDetector>
      
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>Pinch to zoom • Drag to rotate • Tap keys 🎹</Text>
      </View>
    </View>
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
