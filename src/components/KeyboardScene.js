import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber/native';
import { TextureLoader } from 'expo-three';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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

// Logo configuration
const LOGO_CONFIG = [
  { 
    id: 'javascript', 
    name: 'JavaScript',
    position: [-8, 11, -5],
    color: '#F7DF1E',
    techStack: 'JavaScript'
  },
  { 
    id: 'css', 
    name: 'CSS',
    position: [-6, 6, -3],
    color: '#1572B6',
    techStack: 'CSS'
  },
  { 
    id: 'python', 
    name: 'Python',
    position: [-4, 10, -4],
    color: '#3776AB',
    techStack: 'Python'
  },
  { 
    id: 'github', 
    name: 'GitHub',
    position: [-1, 8, -2],
    color: '#ffffff',
    techStack: null
  },
];

// ============================================
// FLOATING LOGO - TEXTURED CUBE
// ============================================
function FloatingLogo({ config, isZoomedInRef, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const timeOffset = useRef(Math.random() * Math.PI * 2);
  const bobSpeed = useRef(0.5 + Math.random() * 0.5);
  const bobAmount = useRef(0.3 + Math.random() * 0.3);

  // Load texture using expo-three's TextureLoader (React Native compatible)
  const textureURI = global.logoTextureURIs?.[config.id];
  const texture = useLoader(TextureLoader, textureURI || '');

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const isZoomedIn = isZoomedInRef.current;
    const time = state.clock.elapsedTime;
    const baseY = config.position[1];
    
    // Show/hide instantly
    meshRef.current.visible = isZoomedIn;
    if (glowRef.current) glowRef.current.visible = isZoomedIn;
    
    if (isZoomedIn) {
      // Bob up and down
      meshRef.current.position.y = baseY + Math.sin(time * bobSpeed.current + timeOffset.current) * bobAmount.current;
      
      // Rotate slowly
      meshRef.current.rotation.x = time * 0.2;
      meshRef.current.rotation.y = time * 0.3;
      
      // Sync glow position
      if (glowRef.current) {
        glowRef.current.position.copy(meshRef.current.position);
        glowRef.current.rotation.copy(meshRef.current.rotation);
      }
    }
  });

  return (
    <group>
      {/* Main textured cube */}
      <mesh
        ref={meshRef}
        position={config.position}
        onClick={onClick}
        onPointerDown={onClick}
        visible={false}
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial 
          map={texture}
          metalness={0.3}
          roughness={0.4}
          emissive={config.color}
          emissiveIntensity={0.15}
        />
      </mesh>
      
      {/* Glow outline */}
      <mesh
        ref={glowRef}
        position={config.position}
        visible={false}
      >
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshBasicMaterial 
          color={config.color}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
}

// ============================================
// CAMERA CONTROLLER
// ============================================
function CameraController({ isZoomedInRef }) {
  const { camera } = useThree();
  const autoRotateAngle = useRef(0);
  
  useEffect(() => {
    camera.position.copy(CAMERA_STATES.ZOOMED_OUT.position);
  }, [camera]);

  useFrame((state, delta) => {
    const isZoomedIn = isZoomedInRef.current;
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
    
    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(new THREE.Vector3(-4, 2, -2));
  });

  return null;
}

// ============================================
// SCENE CONTENT
// ============================================
function SceneContent({ isZoomedInRef, onReady, onLogoClick }) {
  const { camera, scene, gl } = useThree();
  const setupDone = useRef(false);

  useEffect(() => {
    if (setupDone.current || !global.keyboardModelCloned) return;
    
    scene.add(global.keyboardModelCloned);
    setupDone.current = true;
    onReady?.({ camera, scene, gl });
  }, [camera, scene, gl, onReady]);

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <directionalLight position={[-10, 10, 10]} intensity={1.5} />
      <directionalLight position={[0, -5, 10]} intensity={1.2} />
      <pointLight position={[0, 15, 0]} intensity={1} distance={30} />
      
      <CameraController isZoomedInRef={isZoomedInRef} />
      
      {LOGO_CONFIG.map((config) => (
        <FloatingLogo
          key={config.id}
          config={config}
          isZoomedInRef={isZoomedInRef}
          onClick={() => onLogoClick(config)}
        />
      ))}
    </>
  );
}

// ============================================
// PROJECT MODAL
// ============================================
function ProjectModal({ visible, onClose, techStack, projects, loading }) {
  const filteredProjects = projects.filter(p => p.tech_stack === techStack);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{techStack} Projects</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a9eff" />
            </View>
          ) : filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No projects yet</Text>
              <Text style={styles.emptyStateSubtext}>
                No {techStack} projects found
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.projectList} showsVerticalScrollIndicator={false}>
              {filteredProjects.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  {project.description && (
                    <Text style={styles.projectDescription}>
                      {project.description}
                    </Text>
                  )}
                  {project.github_link && (
                    <TouchableOpacity
                      style={styles.githubLink}
                      onPress={() => Linking.openURL(project.github_link)}
                    >
                      <Text style={styles.githubLinkText}>View on GitHub →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function KeyboardScene({ projects = [], loading = false }) {
  const isZoomedInRef = useRef(false);
  const [selectedTech, setSelectedTech] = useState(null);
  
  const buttonTextRef = useRef(null);
  const stateTextRef = useRef(null);
  const sceneRef = useRef(null);

  const handleSceneReady = useCallback((sceneData) => {
    sceneRef.current = sceneData;
  }, []);

  const handleZoomToggle = useCallback(() => {
    isZoomedInRef.current = !isZoomedInRef.current;
    const newState = isZoomedInRef.current;
    
    if (buttonTextRef.current) {
      buttonTextRef.current.setNativeProps({ 
        text: newState ? 'ZOOM OUT' : 'TAP TO ZOOM' 
      });
    }
    if (stateTextRef.current) {
      stateTextRef.current.setNativeProps({ 
        text: newState ? '🔍 ZOOMED' : '🌀 ROTATING' 
      });
    }
  }, []);

  const handleLogoClick = useCallback((config) => {
    if (config.id === 'github') {
      Linking.openURL('https://github.com/KhelProgramming');
    } else {
      setSelectedTech(config.techStack);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Canvas 
        camera={{ position: [20, 30, 25], fov: 55 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ flex: 1 }}
      >
        <SceneContent 
          isZoomedInRef={isZoomedInRef}
          onReady={handleSceneReady}
          onLogoClick={handleLogoClick}
        />
      </Canvas>
      
      <Pressable style={styles.zoomButton} onPress={handleZoomToggle}>
        <Text ref={buttonTextRef} style={styles.zoomButtonText}>
          TAP TO ZOOM
        </Text>
      </Pressable>

      <View style={styles.indicator} pointerEvents="none">
        <Text ref={stateTextRef} style={styles.indicatorText}>
          🌀 ROTATING
        </Text>
      </View>

      <ProjectModal
        visible={selectedTech !== null}
        onClose={() => setSelectedTech(null)}
        techStack={selectedTech}
        projects={projects}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  projectList: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  githubLink: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4a9eff',
    borderRadius: 8,
  },
  githubLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
