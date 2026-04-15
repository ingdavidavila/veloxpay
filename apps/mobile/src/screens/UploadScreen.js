import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { getToken } from '../utils/auth';

const UploadScreen = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [customerId, setCustomerId] = useState('');   // or customer name if your backend accepts it
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!invoiceNumber || !totalAmount || !dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();

      const response = await fetch('http://10.0.2.2:5000/api/invoices/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          total_amount: parseFloat(totalAmount),
          due_date: dueDate,
          customer_id: customerId || null,        // adjust based on your backend
          term_days: 30,                          // you can make this dynamic later
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('✅ Success', 'Invoice uploaded successfully!');
        // Clear form
        setInvoiceNumber('');
        setTotalAmount('');
        setDueDate('');
        setCustomerId('');
      } else {
        Alert.alert('Upload Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload invoice. Is the backend running?');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Invoice</Text>
      <Text style={styles.subtitle}>Get instant cash advance</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Invoice Number"
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
        />

        <TextInput
          style={styles.input}
          placeholder="Total Amount ($)"
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Due Date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
        />

        <TextInput
          style={styles.input}
          placeholder="Customer ID or Name (optional)"
          value={customerId}
          onChangeText={setCustomerId}
        />

        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.uploadButtonText}>Submit for Advance</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#27ae60', marginBottom: 30 },
  form: { gap: 16 },
  input: {
    backgroundColor: '#1a1f1a',
    color: '#ffffff',
    padding: 18,
    borderRadius: 14,
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UploadScreen;