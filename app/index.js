console.log('✅ index.js is loading...');
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { preloadKeyboardModel, preloadLogoTextures } from '../utils/preloader';

export default function Index() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState([]);
  const cursorBlink = useRef(new Animated.Value(1)).current;

  // Cursor blinking animation
  useEffect(() => {
    const blinkAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, {
          toValue: 0,
          duration: 530,
          useNativeDriver: true,
        }),
        Animated.timing(cursorBlink, {
          toValue: 1,
          duration: 530,
          useNativeDriver: true,
        }),
      ])
    );
    blinkAnimation.start();
    return () => blinkAnimation.stop();
  }, []);

  // Add a log entry
  const addLog = (message, percent = null) => {
    setLoadingLogs(prev => [...prev, { message, percent, timestamp: Date.now() }]);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing asset preloading...');
        const startTime = Date.now();

        addLog('Initializing Portfolio Showcase V1.0...');
        await new Promise(resolve => setTimeout(resolve, 300));

        addLog('Checking system resources...');
        await new Promise(resolve => setTimeout(resolve, 200));

        addLog('Allocating memory for 3D rendering...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // REAL progress callback
        const handleProgress = (stage, percent, message) => {
          console.log(`[${stage}] ${percent}% - ${message}`);
          
          const stageLabels = {
            loading: 'Loading GLB file from storage',
            parsing: 'Parsing GLTF structure',
            cloning: 'Cloning model (158 meshes, 144 materials)',
            caching: 'Building interaction cache',
            complete: 'Assets ready',
            error: 'Error',
          };

          const label = stageLabels[stage] || message;
          
          // Add log with progress percentage
          if (percent === 0) {
            addLog(`${label}...`, 0);
          } else if (percent === 100) {
            addLog(`${label}...`, 100);
          } else if (stage === 'cloning' && percent % 15 === 0) {
            // Update cloning progress every 15%
            addLog(`${label}...`, percent);
          }
        };

        addLog('Starting asset preload...');
        await new Promise(resolve => setTimeout(resolve, 200));

        // Run the ACTUAL preload with REAL progress tracking
        const result = await preloadKeyboardModel(handleProgress);

        console.log('✅ Preload complete:', result);

        // Preload logo textures
        addLog('Loading logo textures...');
        await preloadLogoTextures((stage, percent, message) => {
          console.log(`[Logos ${stage}] ${percent}% - ${message}`);
          if (percent === 100) {
            addLog('Logo textures loaded', 100);
          }
        });

        const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ TOTAL LOAD TIME: ${loadTime}s`);
        
        addLog(`All assets loaded in ${loadTime}s`, 100);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        addLog("Launching 'Portfolio Showcase V1.0'...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setIsInitialized(true);
        router.replace('/welcome');

      } catch (error) {
        console.warn('Initialization failed, continuing anyway:', error);
        addLog(`ERROR: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsInitialized(true);
        router.replace('/welcome');
      }
    };

    initializeApp();
  }, [router]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.terminal}>
          <Text style={styles.header}>
            PORTFOLIO LOADING SYSTEM V1.0
          </Text>
          <Text style={styles.header}>
            {'='.repeat(50)}
          </Text>
          
          <Text style={styles.blank}>{'\n'}</Text>

          {/* Terminal-style loading logs */}
          {loadingLogs.map((log, index) => (
            <View key={index} style={styles.logLine}>
              <Text style={styles.logText}>
                {'> '}{log.message}
              </Text>
              {log.percent !== null && (
                <Text style={styles.percentText}>
                  {' '}{log.percent}%
                </Text>
              )}
            </View>
          ))}

          {/* Blinking cursor */}
          <View style={styles.cursorLine}>
            <Animated.Text style={[styles.cursor, { opacity: cursorBlink }]}>
              _
            </Animated.Text>
          </View>

          {/* Hint at bottom */}
          {loadingLogs.length > 5 && (
            <Text style={styles.hintText}>
              {'\n'}
              {loadingLogs.some(log => log.message.includes('Cloning')) && 
                'Cloning 144 materials - this takes 10-15s on most devices...'}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  terminal: {
    width: '100%',
    maxWidth: 500,
  },
  header: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  blank: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  logLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 13,
    fontFamily: 'monospace',
    flex: 1,
  },
  percentText: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'right',
  },
  hintText: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    marginTop: 10,
  },
  cursorLine: {
    marginTop: 10,
  },
  cursor: {
    color: 'rgba(255, 255, 255, 1)',
    fontSize: 16,
    fontFamily: 'monospace',
  },
});
