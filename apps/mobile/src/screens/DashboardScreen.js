import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { logout } from '../utils/auth';

const DashboardScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await logout();
    navigation.replace('Landing');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>VELOXPAY</Text>
        <Text style={styles.welcome}>Good morning, Supplier</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>$12,450</Text>
          <Text style={styles.statLabel}>Available Advance</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Pending Invoices</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.uploadButtonText}>Upload New Invoice</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => alert('My Invoices - Coming soon')}
      >
        <Text style={styles.secondaryButtonText}>View All Invoices</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a', padding: 24 },
  header: { alignItems: 'center', marginVertical: 30 },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#d4af37' },
  welcome: { fontSize: 18, color: '#a1a1aa', marginTop: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statCard: { 
    backgroundColor: '#1a1f1a', 
    padding: 20, 
    borderRadius: 16, 
    width: '48%', 
    alignItems: 'center' 
  },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#27ae60' },
  statLabel: { fontSize: 14, color: '#71717a', marginTop: 8 },
  sectionTitle: { fontSize: 20, color: '#ffffff', fontWeight: '600', marginBottom: 16 },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: '#27272a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  secondaryButtonText: { color: '#d4af37', fontSize: 18, fontWeight: '600' },
  logoutButton: { marginTop: 40, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 16 },
});

export default DashboardScreen;