import { Canvas, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import useControls from 'r3f-native-orbitcontrols';
import * as THREE from 'three';
import KeyboardModel from '../models/Keyboard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Map of keycap names to their languages
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

function ClickHandler({ onKeyPress }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    console.log('✅ ClickHandler mounted');
    
    // Log scene structure
    let meshCount = 0;
    scene.traverse((child) => {
      if (child.isMesh && child.name) {
        meshCount++;
        if (meshCount <= 5) {
          console.log(`  📌 Mesh: "${child.name}"`);
        }
      }
    });
    console.log(`📊 Total meshes: ${meshCount}`);

    const canvas = gl.domElement;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      // Check if it's a tap (not a drag)
      const deltaX = Math.abs(endX - touchStart.current.x);
      const deltaY = Math.abs(endY - touchStart.current.y);
      const deltaTime = endTime - touchStart.current.time;

      const isTap = deltaX < 10 && deltaY < 10 && deltaTime < 300;

      if (!isTap) {
        console.log('🔄 Drag detected, ignoring (deltaX:', deltaX, 'deltaY:', deltaY, ')');
        return;
      }

      console.log('👆 Tap detected at:', { x: endX.toFixed(0), y: endY.toFixed(0) });

      try {
        // Get Canvas bounding box (actual position and size on screen)
        const rect = canvas.getBoundingClientRect();
        
        console.log('📦 Canvas bounds:', {
          left: rect.left.toFixed(0),
          top: rect.top.toFixed(0),
          width: rect.width.toFixed(0),
          height: rect.height.toFixed(0)
        });

        // Calculate position RELATIVE to Canvas
        const canvasX = endX - rect.left;
        const canvasY = endY - rect.top;

        console.log('📍 Position relative to Canvas:', {
          x: canvasX.toFixed(0),
          y: canvasY.toFixed(0)
        });

        // Convert to normalized device coordinates (-1 to +1)
        // Using Canvas dimensions, NOT screen dimensions
        const pointer = new THREE.Vector2(
          (canvasX / rect.width) * 2 - 1,
          -(canvasY / rect.height) * 2 + 1
        );

        console.log('🎯 Normalized:', { x: pointer.x.toFixed(3), y: pointer.y.toFixed(3) });

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        console.log(`🔍 Found ${intersects.length} intersections`);

        if (intersects.length > 0) {
          intersects.slice(0, 3).forEach((hit, i) => {
            console.log(`  ${i + 1}. "${hit.object.name || '(unnamed)'}" - dist: ${hit.distance.toFixed(2)}`);
          });

          const clickedObject = intersects[0].object;
          let foundLanguage = KEYCAP_MAP[clickedObject.name];

          if (!foundLanguage && clickedObject.parent?.name) {
            console.log('🔍 Checking parent:', clickedObject.parent.name);
            foundLanguage = KEYCAP_MAP[clickedObject.parent.name];
          }

          if (!foundLanguage && clickedObject.parent?.parent?.name) {
            console.log('🔍 Checking grandparent:', clickedObject.parent.parent.name);
            foundLanguage = KEYCAP_MAP[clickedObject.parent.parent.name];
          }

          if (foundLanguage) {
            console.log(`✅ Language: ${foundLanguage}`);
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
            console.log('⚠️ No mapping for:', clickedObject.name || '(unnamed)');
          }
        } else {
          console.log('❌ No objects hit');
        }
      } catch (error) {
        console.error('❌ Error:', error);
      }
    };

    // Attach to the Canvas element directly
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    console.log('✅ Touch listeners attached to Canvas');

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [camera, scene, gl, raycaster, onKeyPress]);

  return null;
}

function SceneContent({ onKeyPress }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(20, 30, 25);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    console.log('✅ Camera ready');
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

      <ClickHandler onKeyPress={onKeyPress} />
    </>
  );
}

export default function KeyboardScene({ onKeyPress }) {
  const [OrbitControls, events] = useControls();

  return (
    <View style={styles.container}>
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
          <SceneContent onKeyPress={onKeyPress} />
        </Canvas>
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
