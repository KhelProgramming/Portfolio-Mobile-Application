import { Canvas, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import KeyboardModel from '../models/Keyboard';

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
    console.log('✅ ClickHandler ready - Scene loaded');
    
    const handleTap = (e) => {
      try {
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        
        const pointer = new THREE.Vector2(
          ((e.x - rect.left) / rect.width) * 2 - 1,
          -((e.y - rect.top) / rect.height) * 2 + 1
        );

        console.log('👆 Tap at:', { x: e.x.toFixed(0), y: e.y.toFixed(0) });

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        console.log(`🔍 Found ${intersects.length} intersections`);

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          console.log('🖱️ Clicked:', clickedObject.name || '(unnamed)');
          
          let foundLanguage = KEYCAP_MAP[clickedObject.name];
          
          if (!foundLanguage && clickedObject.parent?.name) {
            console.log('🔍 Checking parent:', clickedObject.parent.name);
            foundLanguage = KEYCAP_MAP[clickedObject.parent.name];
          }

          if (foundLanguage) {
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
            console.log('⚠️ No mapping for:', clickedObject.name);
          }
        } else {
          console.log('❌ No objects hit');
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
    console.log('✅ Camera positioned');
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
        return; // Prevent double tap
      }
      lastTapTime.current = now;

      if (handleTapRef.current) {
        handleTapRef.current(e);
      }
    });

  return (
    <View style={styles.container}>
      <View {...events} style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={tapGesture}>
          <View style={StyleSheet.absoluteFill}>
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
        </GestureDetector>
      </View>
      
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
