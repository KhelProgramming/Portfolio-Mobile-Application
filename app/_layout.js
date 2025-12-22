// app/_layout.js
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs([
  'Route "./index.js" is missing',
  '_setGlobalConsole',
  'No route named "index"',
]);

if (typeof global !== 'undefined') {
  global.THREE = global.THREE || {};
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0a0a' },
        }}
      />
    </GestureHandlerRootView>
  );
}
