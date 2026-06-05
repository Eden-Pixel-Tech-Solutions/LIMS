import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import { apiFetch } from '../api';

export default function SampleDetailScreen({ route }) {
  const { sample } = route.params;
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(
    sample.status === 'Collected' || sample.status === 'In Progress' ||
    sample.status === 'Test Done' || sample.status === 'Completed'
  );
  const [barcodeUri, setBarcodeUri] = useState(null);
  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [displaySampleId, setDisplaySampleId] = useState(
    sample.sample_id || sample.lab_barcode || null
  );

  const fetchBarcode = async (sampleId) => {
    const id = sampleId || displaySampleId;
    if (!id) {
      Alert.alert('No Sample ID', 'Sample ID is not assigned yet.');
      return;
    }
    setLoadingBarcode(true);
    try {
      const data = await apiFetch(`/api/barcodes/sample/${encodeURIComponent(id)}`);
      if (data.success && data.barcodeBase64) {
        setBarcodeUri(data.barcodeBase64);
      } else {
        Alert.alert('Error', 'Could not load barcode.');
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch barcode.');
    } finally {
      setLoadingBarcode(false);
    }
  };

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      const token = await SecureStore.getItemAsync('hims_token');
      const userId = await SecureStore.getItemAsync('user_id');
      const data = await apiFetch('/api/lab/acknowledge-test', {
        method: 'POST',
        body: JSON.stringify({
          bill_item_id: sample.bill_item_id,
          sample_id: sample.sample_id || sample.lab_barcode,
          short_id: sample.short_id,
          status: 'Collected',
          collected_by: userId ? parseInt(userId, 10) : null,
        }),
      }, token);

      if (data.success) {
        const resolvedId = data.sample_id || sample.sample_id || sample.lab_barcode;
        setDisplaySampleId(resolvedId);
        setAcknowledged(true);
        Alert.alert('Done', 'Sample acknowledged successfully.');
        fetchBarcode(resolvedId);
      } else {
        Alert.alert('Error', data.message || 'Acknowledgement failed.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setAcknowledging(false);
    }
  };

  const handlePrint = async () => {
    if (!barcodeUri) {
      Alert.alert('No Barcode', 'Please acknowledge first to load the barcode.');
      return;
    }
    const html = `
      <html>
        <body style="margin:0;padding:16px;font-family:monospace;text-align:center;">
          <p style="font-size:13px;margin-bottom:4px;">${sample.patient_name}</p>
          <p style="font-size:11px;color:#555;margin-bottom:8px;">${sample.test_name}</p>
          <img src="${barcodeUri}" style="width:280px;height:auto;" />
          <p style="font-size:11px;margin-top:4px;">${displaySampleId || ''}</p>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Print Error', 'Could not open print dialog.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Patient</Text>
        <Text style={styles.value}>{sample.patient_name}</Text>

        <Text style={styles.label}>Sample ID</Text>
        <Text style={[styles.value, styles.mono]}>{displaySampleId || '—'}</Text>

        <Text style={styles.label}>Test</Text>
        <Text style={styles.value}>{sample.test_name}</Text>

        {sample.tube_color ? (
          <>
            <Text style={styles.label}>Tube</Text>
            <Text style={styles.value}>{sample.tube_color}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Status</Text>
        <View style={[styles.statusBadge, acknowledged ? styles.badgeGreen : styles.badgeBlue]}>
          <Text style={styles.statusText}>{acknowledged ? 'Collected' : sample.status || 'Pending'}</Text>
        </View>
      </View>

      {!acknowledged && (
        <TouchableOpacity style={styles.ackButton} onPress={handleAcknowledge} disabled={acknowledging}>
          {acknowledging
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ackButtonText}>Acknowledge Sample</Text>
          }
        </TouchableOpacity>
      )}

      {acknowledged && !barcodeUri && !loadingBarcode && (
        <TouchableOpacity style={styles.loadBarcodeBtn} onPress={fetchBarcode}>
          <Text style={styles.loadBarcodeBtnText}>Load Barcode</Text>
        </TouchableOpacity>
      )}

      {loadingBarcode && (
        <View style={styles.barcodeBox}>
          <ActivityIndicator size="large" color="#0d2554" />
        </View>
      )}

      {barcodeUri && (
        <View style={styles.barcodeBox}>
          <Image
            source={{ uri: barcodeUri }}
            style={styles.barcodeImage}
            resizeMode="contain"
          />
          <Text style={styles.barcodeLabel}>{displaySampleId || ''}</Text>
        </View>
      )}

      {barcodeUri && (
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.printButtonText}>Print Barcode Label</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginTop: 12, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  mono: { fontFamily: 'monospace' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  badgeBlue: { backgroundColor: '#dbeafe' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  ackButton: {
    backgroundColor: '#0d2554',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  ackButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loadBarcodeBtn: {
    backgroundColor: '#e0e7ff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadBarcodeBtnText: { color: '#3730a3', fontSize: 15, fontWeight: '700' },
  barcodeBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  barcodeImage: { width: 280, height: 80, marginBottom: 8 },
  barcodeLabel: { fontFamily: 'monospace', color: '#475569', fontSize: 12 },
  printButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  printButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
