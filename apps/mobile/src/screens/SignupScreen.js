// apps/mobile/src/screens/SignupScreen.js
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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiUrl } from '../config/api';

const SignupScreen = ({ navigation }) => {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!businessName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Mirrors server/middleware/passwordValidator.js so the user gets
    // feedback before a round trip.
    const passwordProblems = [
      [/^.{8,}$/, 'At least 8 characters'],
      [/[A-Z]/, 'At least one uppercase letter'],
      [/[a-z]/, 'At least one lowercase letter'],
      [/[!@#$%^&*()_+\-=[\]{};:"\\|,.<>/?]/, 'At least one special character'],
    ]
      .filter(([regex]) => !regex.test(password))
      .map(([, message]) => message);

    if (passwordProblems.length > 0) {
      Alert.alert('Invalid Password', passwordProblems.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName,
          business_name: businessName,
          email,
          phone_number: '',
          bank_account: '',
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const saved = await saveAuthData(data.token, data.user || { email }, data.refreshToken);

        if (saved) {
          Alert.alert('✅ Welcome to VeloxPay!', 'Account created successfully');
          navigation.replace('Dashboard');
        }
      } else {
        // The server sends { error } and, for password failures, { error, rules }.
        Alert.alert(
          'Signup Failed',
          [data.error, ...(data.rules || [])].filter(Boolean).join('\n') ||
            'Could not create account'
        );
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

  const handleGoogleSignup = () => {
    Alert.alert('Google Sign Up', 'Google login coming soon...');
    // TODO: We'll connect real Google auth later
  };

  const handleAppleSignup = () => {
    Alert.alert('Apple Sign Up', 'Apple login coming soon...');
    // TODO: We'll connect real Apple auth later (using your existing appleAuth.js)
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join VeloxPay and get paid faster</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            placeholderTextColor="#71717a"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#71717a"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#71717a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#71717a"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Social Login Section */}
          <View style={styles.socialContainer}>
            <Text style={styles.orText}>OR</Text>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appleButton} onPress={handleAppleSignup}>
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={{ color: '#27ae60' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
    paddingHorizontal: 24,
  },
  flex: { flex: 1 },
  // Never put flex:1 on a ScrollView's contentContainerStyle -- it pins the
  // content to the viewport height and scrolling silently stops working.
  // flexGrow:1 lets short content still fill the screen.
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  backButton: { marginTop: 60, marginBottom: 30, alignSelf: 'flex-start' },
  backText: { color: '#d4af37', fontSize: 18, fontWeight: '600' },
  content: { flexGrow: 1 },
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
  form: { width: '100%' },
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
  signupButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Social Login Styles
  socialContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  orText: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  appleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  loginLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#d4af37',
    fontSize: 16,
  },
});

export default SignupScreen;