import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://10.0.2.2:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Check Your Email',
          'If an account exists with this email, you will receive password reset instructions.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Cannot connect to server. Make sure your backend is running.'
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backToLoginText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 60,
    marginBottom: 30,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1f1a',
    color: '#ffffff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  resetButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToLogin: {
    marginTop: 30,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#d4af37',
    fontSize: 16,
  },
});

export default ForgotPasswordScreen;