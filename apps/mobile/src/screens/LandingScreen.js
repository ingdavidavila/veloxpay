import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Background accent */}
      <View style={styles.accentCircle} />

      <View style={styles.content}>
        <Text style={styles.logo}>VELOXPAY</Text>
        
        <Text style={styles.tagline}>
          Get up to 85% cash advance{'\n'}on your invoices instantly
        </Text>

        <Text style={styles.description}>
          Upload your invoice → Get paid today.{'\n'}
          No hidden fees. No waiting.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>
        Secure • Fast • Transparent
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  accentCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#27ae60',
    opacity: 0.15,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#d4af37',
    letterSpacing: 2,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 60,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4af37',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: '#52525b',
    fontSize: 14,
  },
});

export default LandingScreen;