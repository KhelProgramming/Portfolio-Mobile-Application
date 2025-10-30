import { StyleSheet, View } from 'react-native';
import KeyboardScene from '../src/components/KeyboardScene';

export default function HomeScreen() {
  console.log('🏠 HomeScreen rendering...');

  const handleKeyPress = (keyName) => {
    console.log('🎹 Key pressed in home:', keyName);
  };

  const handleCloseOverlay = () => {
    console.log('❌ Close overlay');
  };

  return (
    <View style={styles.container}>
      
      {/* 3D Keyboard - Full screen */}
      <KeyboardScene
        onKeyPress={handleKeyPress}
        isMinimized={false}
        onMinimizedClick={handleCloseOverlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  debugText: {
    position: 'absolute',
    top: 50,
    left: 20,
    color: '#fff',
    fontSize: 16,
    zIndex: 1000,
  },
});