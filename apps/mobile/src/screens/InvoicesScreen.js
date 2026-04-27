// apps/mobile/src/screens/InvoicesScreen.js
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

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const limit = 10; // Pagination: 10 per page

  useEffect(() => {
    fetchInvoices(page);
  }, [page]);

  const fetchInvoices = async (currentPage) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Session Expired', 'Please log in again');
        navigation.replace('Login');
        return;
      }

      const response = await fetch(
        `http://10.0.2.2:5000/api/invoices?page=${currentPage}&limit=${limit}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || data); // Adjust based on your backend response
        setTotalPages(data.totalPages || Math.ceil((data.length || 0) / limit));
        setHasMore(data.hasMore !== false);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Invoices</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && invoices.length === 0 ? (
          <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 50 }} />
        ) : invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No invoices found yet.</Text>
          </View>
        ) : (
          invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>
                  {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
                </Text>
                <Text style={styles.clientName}>{invoice.client_name || 'Unknown Client'}</Text>
                <Text style={styles.date}>
                  Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'TBD'}
                </Text>
              </View>

              <View style={styles.rightSection}>
                <Text style={styles.amount}>
                  ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                </Text>
                <Text style={[
                  styles.status,
                  invoice.status === 'paid' && styles.statusPaid,
                  invoice.status === 'approved' && styles.statusApproved,
                  invoice.status === 'pending' && styles.statusPending,
                ]}>
                  {invoice.status ? invoice.status.toUpperCase() : 'PENDING'}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Pagination Controls */}
        <View style={styles.pagination}>
          <TouchableOpacity 
            style={[styles.pageButton, page === 1 && styles.disabledButton]}
            onPress={goToPreviousPage}
            disabled={page === 1}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {page} of {totalPages}
          </Text>

          <TouchableOpacity 
            style={[styles.pageButton, !hasMore && styles.disabledButton]}
            onPress={loadMore}
            disabled={!hasMore}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1a1f1a',
  },
  backText: { color: '#d4af37', fontSize: 18, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginLeft: 20 },

  scrollContent: { padding: 24, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#a1a1aa', fontSize: 16 },

  invoiceCard: {
    backgroundColor: '#1a1f1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { fontWeight: '600', color: '#ffffff', fontSize: 16 },
  clientName: { color: '#a1a1aa', marginTop: 4 },
  date: { color: '#71717a', fontSize: 13, marginTop: 4 },

  rightSection: { alignItems: 'flex-end' },
  amount: { color: '#27ae60', fontWeight: 'bold', fontSize: 18 },
  status: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  statusPaid: { color: '#22c55e' },
  statusApproved: { color: '#eab308' },
  statusPending: { color: '#f97316' },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  pageButton: {
    backgroundColor: '#1a1f1a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  disabledButton: {
    borderColor: '#4b5563',
    opacity: 0.5,
  },
  pageButtonText: { color: '#27ae60', fontWeight: '600' },
  pageInfo: { color: '#a1a1aa', fontSize: 16 },
});

export default InvoicesScreen;