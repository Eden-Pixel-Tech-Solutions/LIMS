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

  const alreadyCollected =
    sample.status === 'Collected' || sample.status === 'In Progress' ||
    sample.status === 'Test Done' || sample.status === 'Completed';

  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged, setAcknowledged] = useState(alreadyCollected);
  const [shortId, setShortId] = useState(sample.short_id || null);
  const [sampleId, setSampleId] = useState(sample.sample_id || null);
  const [barcodeUri, setBarcodeUri] = useState(null);
  const [loadingBarcode, setLoadingBarcode] = useState(false);

  const fetchBarcode = async (id) => {
    const barcodeId = id || shortId || sample.short_id;
    if (!barcodeId) return;
    setLoadingBarcode(true);
    try {
      const data = await apiFetch(`/api/barcodes/sample/${encodeURIComponent(String(barcodeId))}`);
      if (data.success && data.barcodeBase64) {
        setBarcodeUri(data.barcodeBase64);
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
      const branchId = await SecureStore.getItemAsync('branch_id');

      let newSampleId = sample.sample_id;
      let newShortId = sample.short_id;

      // For Pending items that don't have a sample_id yet, generate one first
      if (!newSampleId) {
        const genData = await apiFetch('/api/lab/generate-sample-id', {
          method: 'POST',
          body: JSON.stringify({
            branch_id: branchId || '1',
            department: sample.category_name || sample.department || 'Laboratory',
          }),
        });
        if (genData.success) {
          newSampleId = genData.sampleId;
          newShortId = genData.shortId;
        }
      }

      const data = await apiFetch('/api/lab/acknowledge-test', {
        method: 'POST',
        body: JSON.stringify({
          bill_item_id: sample.bill_item_id,
          sample_id: newSampleId,
          short_id: newShortId,
          status: 'Collected',
          collected_by: userId ? parseInt(userId, 10) : null,
        }),
      }, token);

      if (data.success) {
        const resolvedShortId = data.short_id || newShortId;
        const resolvedSampleId = data.sample_id || newSampleId;
        setShortId(resolvedShortId);
        setSampleId(resolvedSampleId);
        setAcknowledged(true);
        fetchBarcode(resolvedShortId);
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
      Alert.alert('No Barcode', 'Load the barcode first.');
      return;
    }
    const html = `
      <html>
        <body style="margin:0;padding:24px;font-family:sans-serif;text-align:center;background:#fff;">
          <div style="border:1.5px dashed #cbd5e1;border-radius:12px;padding:24px 20px;background:#f8fafc;display:inline-block;">
            <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:2px;">${sample.patient_name}</div>
            <div style="font-size:26px;font-weight:900;color:#2563eb;font-family:monospace;margin-bottom:2px;">ID: ${shortId || '—'}</div>
            ${sample.sample_type ? `<div style="font-size:12px;color:#64748b;margin-bottom:14px;">${sample.sample_type}</div>` : ''}
            <img src="${barcodeUri}" style="max-width:280px;height:auto;" />
          </div>
          ${sample.test_name ? `
          <div style="margin-top:16px;padding:10px 14px;background:#eff6ff;border-radius:8px;display:inline-block;">
            <div style="font-size:11px;color:#60a5fa;font-weight:700;">TEST</div>
            <div style="font-size:14px;font-weight:700;color:#1e40af;">${sample.test_name}</div>
          </div>` : ''}
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

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.label}>PATIENT</Text>
        <Text style={styles.value}>{sample.patient_name}</Text>

        <Text style={styles.label}>SAMPLE ID</Text>
        <Text style={[styles.value, styles.mono]}>{sampleId || sample.sample_id || '—'}</Text>

        <Text style={styles.label}>TEST</Text>
        <Text style={styles.value}>{sample.test_name}</Text>

        {sample.tube_color ? (
          <>
            <Text style={styles.label}>TUBE</Text>
            <Text style={styles.value}>{sample.tube_color}</Text>
          </>
        ) : null}

        <Text style={styles.label}>STATUS</Text>
        <View style={[styles.statusBadge, acknowledged ? styles.badgeGreen : styles.badgeBlue]}>
          <Text style={[styles.statusText, acknowledged ? styles.statusGreen : styles.statusBlue]}>
            {acknowledged ? 'Collected' : sample.status || 'Pending'}
          </Text>
        </View>
      </View>

      {/* Acknowledge Button */}
      {!acknowledged && (
        <TouchableOpacity style={styles.ackButton} onPress={handleAcknowledge} disabled={acknowledging}>
          {acknowledging
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ackButtonText}>Acknowledge Sample</Text>
          }
        </TouchableOpacity>
      )}

      {/* Load Barcode (if already collected but barcode not yet loaded) */}
      {acknowledged && !barcodeUri && !loadingBarcode && (
        <TouchableOpacity style={styles.loadBarcodeBtn} onPress={() => fetchBarcode()}>
          <Text style={styles.loadBarcodeBtnText}>Load Barcode</Text>
        </TouchableOpacity>
      )}

      {loadingBarcode && (
        <View style={styles.barcodeBox}>
          <ActivityIndicator size="large" color="#0d2554" />
        </View>
      )}

      {/* Barcode Label (BarcodeModal style) */}
      {barcodeUri && (
        <View style={styles.barcodeCard}>
          {/* Label header */}
          <View style={styles.barcodeHeader}>
            <View>
              <Text style={styles.barcodeHeaderSub}>SAMPLE LABEL</Text>
              <Text style={styles.barcodeHeaderName}>{sample.patient_name}</Text>
            </View>
          </View>

          {/* Label body */}
          <View style={styles.labelBody}>
            <Text style={styles.labelPatient}>{sample.patient_name}</Text>
            <Text style={styles.labelShortId}>ID: {shortId || '—'}</Text>
            {sample.sample_type
              ? <Text style={styles.labelSampleType}>{sample.sample_type}</Text>
              : null}
            <Image source={{ uri: barcodeUri }} style={styles.barcodeImage} resizeMode="contain" />
          </View>

          {/* Test name chip */}
          {sample.test_name && (
            <View style={styles.testChip}>
              <Text style={styles.testChipLabel}>TEST</Text>
              <Text style={styles.testChipName}>{sample.test_name}</Text>
            </View>
          )}
        </View>
      )}

      {barcodeUri && (
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.printButtonText}>Print Label</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginTop: 14, marginBottom: 2 },
  value: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 4 },
  badgeBlue: { backgroundColor: '#dbeafe' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusBlue: { color: '#1e40af' },
  statusGreen: { color: '#166534' },

  ackButton: {
    backgroundColor: '#0d2554', borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 16,
  },
  ackButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  loadBarcodeBtn: {
    backgroundColor: '#e0e7ff', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 16,
  },
  loadBarcodeBtnText: { color: '#3730a3', fontSize: 15, fontWeight: '700' },

  barcodeBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', marginBottom: 16,
  },

  /* Barcode card — matches BarcodeModal */
  barcodeCard: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  barcodeHeader: {
    backgroundColor: '#0f172a', padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  barcodeHeaderSub: { color: '#38bdf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  barcodeHeaderName: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },

  labelBody: {
    margin: 20,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#cbd5e1',
    borderRadius: 12, padding: 20, alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  labelPatient: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  labelShortId: { fontSize: 24, fontWeight: '900', color: '#2563eb', fontFamily: 'monospace', marginBottom: 2 },
  labelSampleType: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 14 },
  barcodeImage: { width: 280, height: 80 },

  testChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#eff6ff', marginHorizontal: 20, marginBottom: 20,
    padding: 10, borderRadius: 8,
  },
  testChipLabel: { fontSize: 10, color: '#60a5fa', fontWeight: '700', letterSpacing: 0.5 },
  testChipName: { fontSize: 13, fontWeight: '700', color: '#1e40af' },

  printButton: {
    backgroundColor: '#16a34a', borderRadius: 14, padding: 18, alignItems: 'center',
  },
  printButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
