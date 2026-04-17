// apps/mobile/src/screens/DashboardScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DashboardScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.businessName}>Business Name</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$12,450</Text>
            <Text style={styles.statLabel}>Available Balance</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Pending Invoices</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Upload')}   // We'll create Upload later
          >
            <Text style={styles.actionButtonText}>📄 Upload Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Invoices')}
          >
            <Text style={styles.actionButtonText}>📋 My Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.recentCard}>
          <Text style={styles.recentText}>
            No recent activity yet.{'\n'}
            Upload your first invoice to get started.
          </Text>
        </View>

      </ScrollView>

      {/* Bottom Navigation Bar (Placeholder) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navTextActive}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>📋 Invoices</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>📤 Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  welcome: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#a1a1aa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  actionButtonText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  recentText: {
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1f1a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  navTextActive: {
    color: '#27ae60',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen;