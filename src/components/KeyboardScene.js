import { OrbitControls, PerspectiveCamera } from '@react-three/drei/native';
import { Canvas, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import KeyboardModel from '../models/Keyboard';

function SceneContent() {
  const cameraRef = useRef();
  const controlsRef = useRef();
  const { set } = useThree();

  useEffect(() => {
    // 👇 Replace default camera with our manual one
    if (cameraRef.current) {
      set({ camera: cameraRef.current });
    }
  }, [set]);

  return (
    <>
      {/* Real PerspectiveCamera */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[20, 30, 25]} // Adjust for your preferred starting angle
        fov={55}
      />

      {/* Lights */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, 10, 10]} intensity={1.5} />
      <directionalLight position={[0, -5, 10]} intensity={1.2} />

      {/* Model */}
      <Suspense fallback={null}>
        <KeyboardModel />
      </Suspense>

      {/* Orbit Controls — bound to cameraRef */}
      <OrbitControls
        ref={controlsRef}
        args={[cameraRef.current, undefined]} // 👈 ensures correct camera binding
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.8}
        enableZoom
        zoomSpeed={0.8}
        minDistance={8}
        maxDistance={60}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.6}
        onStart={() => console.log('✋ Touch started')}
        onEnd={() => console.log('👉 Released')}
      />
    </>
  );
}

export default function KeyboardScene() {
  return (
    <View style={styles.container}>
      <Canvas>
        <SceneContent />
      </Canvas>
      <View style={styles.hint}>
        <Text style={styles.hintText}>Pinch & drag to explore 🎹</Text>
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