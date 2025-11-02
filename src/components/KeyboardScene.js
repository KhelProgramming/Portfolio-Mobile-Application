import { Canvas, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import KeyboardModel from '../models/Keyboard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map of keycap names to their languages (from your GLB file)
const KEYCAP_MAP = {
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
  'Cube021_1': 'c',
  'Cube021_2': 'c',
  'Cube035_1': 'python',
  'Cube035_2': 'python',
};

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

function ClickHandler({ onKeyPress, handleTapRef }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;

  useEffect(() => {
    console.log('✅ ClickHandler ready');
    console.log('📦 Scene children:', scene.children.length);
    
    // Log all mesh names for debugging
    let meshCount = 0;
    scene.traverse((child) => {
      if (child.isMesh && child.name) {
        meshCount++;
        if (meshCount <= 5) { // Show first 5 for reference
          console.log(`  📌 Found mesh: "${child.name}"`);
        }
      }
    });
    console.log(`📊 Total meshes found: ${meshCount}`);
    
    const handleTap = (e) => {
      try {
        // FIX #2: Use absolute coordinates for React Native
        const x = e.absoluteX;
        const y = e.absoluteY;
        
        console.log('👆 Tap at absolute:', { x: x.toFixed(0), y: y.toFixed(0) });
        console.log('📐 Screen size:', { width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
        
        // Convert to normalized device coordinates (-1 to +1)
        const pointer = new THREE.Vector2(
          (x / SCREEN_WIDTH) * 2 - 1,
          -(y / SCREEN_HEIGHT) * 2 + 1
        );
        
        console.log('🎯 Normalized coords:', { x: pointer.x.toFixed(3), y: pointer.y.toFixed(3) });

        raycaster.setFromCamera(pointer, camera);
        
        // FIX #3: Use recursive=true to traverse ALL nested groups
        const intersects = raycaster.intersectObjects(scene.children, true);

        console.log(`🔍 Raycasting found ${intersects.length} intersections`);
        
        if (intersects.length > 0) {
          // Log first 3 intersections for debugging
          intersects.slice(0, 3).forEach((hit, i) => {
            console.log(`  ${i + 1}. ${hit.object.name || '(unnamed)'} - distance: ${hit.distance.toFixed(2)}`);
          });
          
          const clickedObject = intersects[0].object;
          console.log('🖱️ Closest object:', clickedObject.name || '(unnamed)');
          
          let foundLanguage = KEYCAP_MAP[clickedObject.name];
          
          if (!foundLanguage && clickedObject.parent?.name) {
            console.log('🔍 Checking parent:', clickedObject.parent.name);
            foundLanguage = KEYCAP_MAP[clickedObject.parent.name];
          }
          
          // Also check grandparent if needed
          if (!foundLanguage && clickedObject.parent?.parent?.name) {
            console.log('🔍 Checking grandparent:', clickedObject.parent.parent.name);
            foundLanguage = KEYCAP_MAP[clickedObject.parent.parent.name];
          }

          if (foundLanguage) {
            console.log(`✅ Language detected: ${foundLanguage}`);
            console.log(`🎯 PRESSED: ${languageNames[foundLanguage]}`);
            
            if (clickedObject.material?.emissive) {
              const original = clickedObject.material.emissive.getHex();
              clickedObject.material.emissive.setHex(0x4a9eff);
              setTimeout(() => {
                clickedObject.material.emissive.setHex(original);
              }, 200);
            }
            
            if (onKeyPress) onKeyPress(foundLanguage);
          } else {
            console.log('⚠️ No mapping found for:', clickedObject.name);
          }
        } else {
          console.log('❌ No objects hit by raycast');
        }
      } catch (error) {
        console.error('❌ Click error:', error);
      }
    };

    handleTapRef.current = handleTap;
  }, [camera, scene, gl, raycaster, onKeyPress, handleTapRef]);

  return null;
}

function SceneContent({ onKeyPress, handleTapRef }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(20, 30, 25);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    console.log('✅ Camera positioned at:', camera.position);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, 10, 10]} intensity={1.5} />
      <directionalLight position={[0, -5, 10]} intensity={1.2} />

      <Suspense fallback={null}>
        <KeyboardModel />
      </Suspense>

      <ClickHandler onKeyPress={onKeyPress} handleTapRef={handleTapRef} />
    </>
  );
}

export default function KeyboardScene({ onKeyPress }) {
  const [OrbitControls, events] = useControls();
  const handleTapRef = useRef();
  const lastTapTime = useRef(0);

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        console.log('⚠️ Double tap ignored');
        return;
      }
      lastTapTime.current = now;

      if (handleTapRef.current) {
        handleTapRef.current(e);
      }
    });

  return (
    <View style={styles.container}>
      {/* FIX #1: OrbitControls events wrap only the Canvas, tap gesture inside */}
      <View {...events} style={StyleSheet.absoluteFill}>
        <Canvas camera={{ position: [20, 30, 25], fov: 55 }}>
          <OrbitControls
            enableDamping={true}
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
          <SceneContent onKeyPress={onKeyPress} handleTapRef={handleTapRef} />
        </Canvas>
      </View>

      {/* Tap gesture layer on top - doesn't block OrbitControls */}
      <GestureDetector gesture={tapGesture}>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" />
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
