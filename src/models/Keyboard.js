import { useLoader } from '@react-three/fiber/native';
import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three-stdlib';

function KeyboardModel(props) {
  const [modelUri, setModelUri] = useState(null);

  useEffect(() => {
    async function loadAsset() {
      try {
        console.log('🔵 Loading asset...');
        const asset = Asset.fromModule(require('../../assets/keyboard.glb'));
        await asset.downloadAsync();
        
        console.log('✅ Asset URI:', asset.localUri);
        setModelUri(asset.localUri);
      } catch (error) {
        console.error('❌ Asset load error:', error);
      }
    }
    loadAsset();
  }, []);

  if (!modelUri) {
    console.log('⏳ Waiting for URI...');
    return null;
  }

  return <LoadedModel uri={modelUri} {...props} />;
}

function LoadedModel({ uri, ...props }) {
  console.log('🎨 Loading GLTF from:', uri);
  
  const gltf = useLoader(GLTFLoader, uri);
  
  console.log('✅ GLTF loaded! Scene has', gltf.scene.children.length, 'children');
  
  return <primitive object={gltf.scene} {...props} />;
}

export default KeyboardModel;