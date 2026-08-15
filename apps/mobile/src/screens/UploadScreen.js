// apps/mobile/src/screens/UploadScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getToken } from '@veloxpay/auth';

const UploadScreen = ({ navigation }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [termDays, setTermDays] = useState('30');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTermDropdown, setShowTermDropdown] = useState(false);

  const termOptions = [
    { label: '30 Days', value: '30' },
    { label: '60 Days', value: '60' },
    { label: '90 Days', value: '90' },
  ];

  // Auto-calculate Due Date when Term Days changes
  useEffect(() => {
    if (termDays) {
      const today = new Date();
      const due = new Date(today);
      due.setDate(today.getDate() + parseInt(termDays));
      
      // Format as YYYY-MM-DD
      const formattedDate = due.toISOString().split('T')[0];
      setDueDate(formattedDate);
    }
  }, [termDays]);

  // Open Camera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Pick from Gallery
  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!invoiceNumber || !totalAmount || !dueDate || !customerId || !selectedImage) {
      Alert.alert('Error', 'Please fill all required fields and select a photo.');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        navigation.replace('Login');
        return;
      }

      const formData = new FormData();
      formData.append('invoice_number', invoiceNumber);
      formData.append('total_amount', totalAmount);
      formData.append('due_date', dueDate);
      formData.append('term_days', termDays);
      formData.append('customer_id', customerId);
      formData.append('customer_name', customerName || '');

      formData.append('invoice', {
        uri: selectedImage.uri,
        name: `invoice_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const response = await fetch('http://10.0.2.2:5000/api/invoices/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          '✅ Success',
          `Invoice ${invoiceNumber} uploaded successfully!\nYou will receive your advance shortly.`
        );
        // Reset form
        setInvoiceNumber('');
        setTotalAmount('');
        setDueDate('');
        setCustomerId('');
        setCustomerName('');
        setSelectedImage(null);
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Upload Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Upload Invoice</Text>
        <Text style={styles.subtitle}>Get up to 85% cash advance instantly</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Invoice Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="INV-00123"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
          />

          <Text style={styles.label}>Total Amount ($) *</Text>
          <TextInput
            style={styles.input}
            placeholder="1250.00"
            keyboardType="decimal-pad"
            value={totalAmount}
            onChangeText={setTotalAmount}
          />

          <Text style={styles.label}>Term Days *</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowTermDropdown(!showTermDropdown)}
          >
            <Text style={styles.dropdownText}>
              {termOptions.find(opt => opt.value === termDays)?.label || '30 Days'}
            </Text>
          </TouchableOpacity>

          {showTermDropdown && (
            <View style={styles.dropdownMenu}>
              {termOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setTermDays(option.value);
                    setShowTermDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Due Date (Auto-calculated) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#27272a' }]}
            value={dueDate}
            editable={false}   // User cannot manually edit due date
          />

          <Text style={styles.label}>Customer ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer ID"
            value={customerId}
            onChangeText={setCustomerId}
          />

          <Text style={styles.label}>Customer Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Client Company Name"
            value={customerName}
            onChangeText={setCustomerName}
          />

          {/* Image Selection */}
          <Text style={styles.label}>Invoice Photo *</Text>
          
          <View style={styles.imageOptions}>
            <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
              <Text style={styles.optionText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={pickFromGallery}>
              <Text style={styles.optionText}>🖼️ Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <Text style={styles.previewText}>Photo Ready for Upload</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.uploadButton, !selectedImage && styles.disabledButton]}
            onPress={handleUpload}
            disabled={loading || !selectedImage}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Invoice & Request Advance</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0a' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  backButton: { marginTop: 60, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: '#d4af37', fontSize: 18, fontWeight: '600' },

  title: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 17, color: '#27ae60', textAlign: 'center', marginBottom: 30 },

  form: { width: '100%' },
  label: { color: '#a1a1aa', fontSize: 15, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#1a1f1a',
    color: '#ffffff',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },

  dropdownButton: {
    backgroundColor: '#1a1f1a',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  dropdownText: { color: '#ffffff', fontSize: 16 },
  dropdownMenu: {
    backgroundColor: '#1a1f1a',
    borderRadius: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  dropdownItemText: { color: '#ffffff', fontSize: 16 },

  imageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#1a1f1a',
    padding: 16,
    borderRadius: 14,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  optionText: { color: '#d4af37', fontWeight: '600' },

  previewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  previewText: {
    color: '#27ae60',
    marginTop: 8,
    fontWeight: '600',
  },

  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 30,
  },
  disabledButton: {
    backgroundColor: '#4b5563',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UploadScreen;