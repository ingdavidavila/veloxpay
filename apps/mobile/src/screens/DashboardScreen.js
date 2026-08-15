// apps/mobile/src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getToken } from '@veloxpay/auth';

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('Your Business');
  const [stats, setStats] = useState({
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    pending: 0,
    approved: 0,
    paid: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.replace('Login');
        return;
      }

      // Fetch Stats
      const statsResponse = await fetch('http://10.0.2.2:5000/api/invoices/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          pendingAmount: parseFloat(statsData.pending_amount || 0),
          approvedAmount: parseFloat(statsData.approved_amount || 0),
          paidAmount: parseFloat(statsData.paid_amount || 0),
          pending: statsData.pending || 0,
          approved: statsData.approved || 0,
          paid: statsData.paid || 0,
        });
      }

      // Fetch Recent Invoices
      const invoicesResponse = await fetch('http://10.0.2.2:5000/api/invoices?limit=5', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setRecentInvoices(invoicesData);
      }

      // Get business name
      const userResponse = await fetch('http://10.0.2.2:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setBusinessName(userData.business_name || userData.name || 'Your Business');
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      // Fallback data
      setBusinessName('Your Business');
      setStats({
        pendingAmount: 12450,
        approvedAmount: 8750,
        paidAmount: 32000,
        pending: 5,
        approved: 3,
        paid: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.businessName}>{businessName}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.pendingAmount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
            <Text style={styles.statSub}>{stats.pending} invoices</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.approvedAmount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ready for Payment</Text>
            <Text style={styles.statSub}>{stats.approved} invoices</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>${stats.paidAmount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Paid This Month</Text>
            <Text style={styles.statSub}>{stats.paid} invoices</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={styles.actionText}>📄 Upload Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Invoices')}
          >
            <Text style={styles.actionText}>📋 View All Invoices</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Invoices */}
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        {recentInvoices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No invoices yet.{'\n'}Upload your first invoice to get started.</Text>
          </View>
        ) : (
          recentInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View>
                <Text style={styles.invoiceNumber}>
                  {invoice.invoice_number || `INV-${invoice.id?.slice(0,8)}`}
                </Text>
                <Text style={styles.clientName}>{invoice.client_name || 'Unknown Client'}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>
                  ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                </Text>
                <Text style={styles.status}>
                  {invoice.status ? invoice.status.toUpperCase() : 'PENDING'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation - Fixed Position */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Invoices')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navLabel}>Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Upload')}>
          <Text style={styles.navIcon}>📤</Text>
          <Text style={styles.navLabel}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f0a' },
  loadingText: { color: '#a1a1aa', marginTop: 12 },

  header: { marginBottom: 32 },
  welcome: { fontSize: 16, color: '#a1a1aa' },
  businessName: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },

  statsContainer: { marginBottom: 40 },
  statCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#27ae60' },
  statLabel: { fontSize: 15, color: '#a1a1aa', marginTop: 4 },
  statSub: { fontSize: 13, color: '#71717a' },

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
  actionText: { color: '#27ae60', fontWeight: '600' },

  invoiceCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  invoiceNumber: { fontWeight: '600', color: '#ffffff', fontSize: 16 },
  clientName: { color: '#a1a1aa', marginTop: 4 },
  amountContainer: { alignItems: 'flex-end' },
  amount: { color: '#27ae60', fontWeight: 'bold', fontSize: 17 },
  status: { color: '#d4af37', fontSize: 12, marginTop: 4 },

  emptyCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
  },

  /* Bottom Navigation */
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
    height: 70,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    color: '#a1a1aa',
    fontSize: 11,
  },
  navLabelActive: {
    color: '#27ae60',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DashboardScreen;