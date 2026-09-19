import React from 'react';
  import { NavigationContainer } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import LandingScreen from '../screens/LandingScreen';
  import LoginScreen from '../screens/LoginScreen';
  import SignupScreen from '../screens/SignupScreen';
  import DashboardScreen from '../screens/DashboardScreen';
  import UploadScreen from '../screens/UploadScreen';
  import InvoicesScreen from '../screens/InvoicesScreen';
  import ProfileScreen from '../screens/ProfileScreen';
  import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

  const Stack = createStackNavigator();

  export default function MainNavigator() {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

          {/* Post-login screens. Every name below is a target of a
              navigation.navigate()/replace() call somewhere in src/screens,
              so all of them must be registered or the app throws
              "was not handled by any navigator" at runtime. */}
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="Invoices" component={InvoicesScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
