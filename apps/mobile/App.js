import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screens (we'll create them next)
import LoginScreen from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#0a0f0a" />

        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0a0f0a',
            },
            headerTintColor: '#d4af37', // gold
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#ffffff',
            },
            contentStyle: {
              backgroundColor: '#0a0f0a',
            },
          }}
        >
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          {/* We'll add more screens here later: Dashboard, Upload, etc. */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}