// apps/mobile/src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '@veloxpay/auth';

const ProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [plaidLoading, setPlaidLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    businessName: '',
    email: '',
    phone: '',
  });

  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalEarned: 0,
    approved: 0,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.replace('Login');
        return;
      }

      const userRes = await fetch('http://10.0.2.2:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        setProfileData({
          businessName: userData.business_name || userData.name || 'Your Business',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        setBankConnected(!!userData.supplier_plaid_access_token || !!userData.has_bank_account);
      }

      const statsRes = await fetch('http://10.0.2.2:5000/api/invoices/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          totalInvoices: (data.pending || 0) + (data.approved || 0) + (data.paid || 0),
          totalEarned: (parseFloat(data.pending_amount || 0) + 
                        parseFloat(data.approved_amount || 0) + 
                        parseFloat(data.paid_amount || 0)),
          approved: data.approved || 0,
        });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    setPlaidLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('http://10.0.2.2:5000/api/plaid/supplier-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Plaid Initialized',
          'Bank connection flow would open here.\n\n(This is a placeholder - full Plaid integration requires a development build)'
        );
        // In the future we'll open the Plaid Link here
      } else {
        Alert.alert('Error', data.error || 'Failed to initialize Plaid');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Could not connect to Plaid service');
      console.error(error);
    } finally {
      setPlaidLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://10.0.2.2:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_name: profileData.businessName,
          phone: profileData.phone,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Log Out', style: 'destructive', onPress: () => navigation.replace('Login') },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account and settings</Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalInvoices}</Text>
            <Text style={styles.statLabel}>Total Invoices</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.totalEarned.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.accountSection}>
          <View style={styles.accountHeader}>
            <Text style={styles.accountTitle}>{profileData.businessName}</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Business Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.businessName}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, businessName: text }))}
              />
            ) : (
              <Text style={styles.value}>{profileData.businessName}</Text>
            )}
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profileData.email}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{profileData.phone || 'Not provided'}</Text>
            )}
          </View>

          {/* Bank Account Section */}
          <View style={styles.detailItem}>
            <Text style={styles.label}>Receiving Bank Account</Text>
            {bankConnected ? (
              <Text style={styles.bankConnected}>✅ Bank account is connected</Text>
            ) : (
              <TouchableOpacity 
                style={styles.connectBankBtn} 
                onPress={handleConnectBank}
                disabled={plaidLoading}
              >
                <Text style={styles.connectBankText}>
                  {plaidLoading ? 'Connecting...' : 'Connect Bank Account'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f0a' },

  backButton: { marginTop: 60, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: '#d4af37', fontSize: 18, fontWeight: '600' },

  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 17, color: '#a1a1aa', textAlign: 'center', marginBottom: 30 },

  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#27ae60' },
  statLabel: { fontSize: 12, color: '#a1a1aa', textAlign: 'center', marginTop: 6 },

  accountSection: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  accountTitle: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  editText: { color: '#d4af37', fontWeight: '600' },

  detailItem: { marginBottom: 20 },
  label: { color: '#a1a1aa', fontSize: 14, marginBottom: 4 },
  value: { color: '#ffffff', fontSize: 16 },
  input: {
    backgroundColor: '#27272a',
    color: '#ffffff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },

  bankConnected: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16 },
  connectBankBtn: {
    backgroundColor: '#27ae60',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  connectBankText: { color: '#ffffff', fontWeight: '600' },

  saveButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  logoutButton: {
    backgroundColor: '#991b1b',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 40,
  },
  logoutText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
});

export default ProfileScreen;