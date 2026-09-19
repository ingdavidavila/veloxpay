import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './src/navigation/MainNavigator';

// SafeAreaProvider must wrap the whole app. Every screen renders a
// <SafeAreaView> from react-native-safe-area-context, and without this
// provider those views have no inset context to measure against -- the
// flex chain collapses and any ScrollView inside them stops scrolling.
export default function App() {
  return (
    <SafeAreaProvider>
      <MainNavigator />
    </SafeAreaProvider>
  );
}
