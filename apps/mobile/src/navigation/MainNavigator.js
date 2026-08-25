import React from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import LandingScreen from '../screens/LandingScreen';
  import LoginScreen from '../screens/LoginScreen';
  import SignupScreen from '../screens/SignupScreen';

  const Stack = createStackNavigator();

  export default function MainNavigator() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          {/* Add more screens as needed */}
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
