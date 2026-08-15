import { saveAuthData } from '@veloxpay/auth';
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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter email and password');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('http://10.0.2.2:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      const saved = await saveAuthData(data.token, data.user || { email });

      if (saved) {
        Alert.alert('✅ Welcome back!', 'Login successful');
        navigation.replace('Dashboard');  
      }
    } else {
      Alert.alert('Login Failed', data.message || 'Invalid email or password');
    }
  } catch (error) {
    Alert.alert(
      'Connection Error', 
      'Cannot connect to server.\nMake sure your backend is running.'
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to manage your invoices</Text>

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

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
  style={styles.forgotButton}
  onPress={() => navigation.navigate('ForgotPassword')}   // ← Change to this
>
  <Text style={styles.forgotText}>Forgot Password?</Text>
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
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1f1a',
    color: '#ffffff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  loginButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotText: {
    color: '#d4af37',
    fontSize: 16,
  },
});

export default LoginScreen;