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
  const [qrUri, setQrUri] = useState(null);
  const [loadingBarcode, setLoadingBarcode] = useState(false);

  const fetchBarcode = async (id) => {
    // Prefer short_id for compact barcode; fall back to full sample_id
    const barcodeId = id || shortId || sample.short_id || sampleId || sample.sample_id || sample.lab_barcode;
    if (!barcodeId) {
      Alert.alert('No ID', 'No sample ID available to generate barcode. Please acknowledge first.');
      return;
    }
    setLoadingBarcode(true);
    try {
      const fullSampleId = sampleId || sample.sample_id || barcodeId;
      const url = `/api/barcodes/sample/${encodeURIComponent(String(barcodeId))}?full_id=${encodeURIComponent(String(fullSampleId))}`;
      const data = await apiFetch(url);
      if (data.success && data.barcodeBase64) {
        setBarcodeUri(data.barcodeBase64);
        setQrUri(data.qrBase64 || null);
      } else {
        Alert.alert('Error', data.message || 'Barcode generation failed.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reach server.');
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
    const resolvedSampleId = sampleId || sample.sample_id || '—';
    const resolvedShortId  = shortId  || sample.short_id  || '—';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            @page {
              size: 2.25in 1.25in;
              margin: 0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              width: 2.25in;
              height: 1.25in;
              font-family: 'Courier New', Courier, monospace;
              background: #fff;
              color: #000;
              padding: 2mm 3mm 1mm 3mm;
              overflow: hidden;
            }
            .patient  { font-size: 8pt; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .row      { display: flex; justify-content: space-between; align-items: baseline; margin-top: 1mm; }
            .key      { font-size: 5.5pt; color: #555; text-transform: uppercase; letter-spacing: 0.3pt; }
            .val      { font-size: 6pt; font-weight: 700; }
            .short    { font-size: 9pt; font-weight: 900; }
            .divider  { border: none; border-top: 0.5pt solid #ccc; margin: 1.5mm 0 1mm; }
            .barcode  { display: block; width: 100%; height: auto; }
            .bc-label { text-align: center; font-size: 5.5pt; margin-top: 0.5mm; letter-spacing: 1pt; }
          </style>
        </head>
        <body>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="flex:1;padding-right:2mm;">
              <div class="patient">${sample.patient_name}</div>
              <div class="row">
                <span class="key">Sample ID</span>
                <span class="val" style="font-size:5pt;max-width:1.1in;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${resolvedSampleId}</span>
              </div>
              <div class="row">
                <span class="key">Short</span>
                <span class="val short">${resolvedShortId}</span>
              </div>
              ${sample.test_code ? `<div class="row"><span class="key">Test Code</span><span class="val">${sample.test_code}</span></div>` : ''}
              ${sample.test_name ? `<div class="row"><span class="key">Test</span><span class="val" style="max-width:1.1in;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${sample.test_name}</span></div>` : ''}
            </div>
            ${qrUri ? `<div style="text-align:center;flex-shrink:0;">
              <img src="${qrUri}" style="width:0.7in;height:0.7in;display:block;" />
              <div style="font-size:4.5pt;color:#555;margin-top:0.5mm;">FULL ID</div>
            </div>` : ''}
          </div>
          <hr class="divider"/>
          <img class="barcode" src="${barcodeUri}" />
          <div class="bc-label">${resolvedShortId}</div>
        </body>
      </html>
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

      {/* Barcode Label */}
      {barcodeUri && (
        <View style={styles.barcodeCard}>
          {/* Header */}
          <View style={styles.barcodeHeader}>
            <Text style={styles.barcodeHeaderSub}>SAMPLE LABEL</Text>
            <Text style={styles.barcodeHeaderName}>{sample.patient_name}</Text>
          </View>

          {/* Label body */}
          <View style={styles.labelBody}>
            {/* Top row: text fields + QR code */}
            <View style={styles.labelTopRow}>
              <View style={styles.labelFields}>
                <Text style={styles.labelPatient}>{sample.patient_name}</Text>

                <View style={styles.labelRow}>
                  <Text style={styles.labelRowKey}>Sample ID</Text>
                  <Text style={[styles.labelRowVal, styles.mono]} numberOfLines={2} adjustsFontSizeToFit>
                    {sampleId || sample.sample_id || '—'}
                  </Text>
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.labelRowKey}>Short Code</Text>
                  <Text style={[styles.labelRowVal, styles.mono, styles.shortCodeText]}>
                    {shortId || sample.short_id || '—'}
                  </Text>
                </View>

                {sample.test_code ? (
                  <View style={styles.labelRow}>
                    <Text style={styles.labelRowKey}>Test Code</Text>
                    <Text style={[styles.labelRowVal, styles.mono]}>{sample.test_code}</Text>
                  </View>
                ) : null}
              </View>

              {/* QR Code */}
              {qrUri && (
                <View style={styles.qrBlock}>
                  <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
                  <Text style={styles.qrLabel}>Full ID</Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Barcode (short_id) */}
            <Text style={styles.barcodeSubtitle}>SHORT CODE BARCODE</Text>
            <Image source={{ uri: barcodeUri }} style={styles.barcodeImage} resizeMode="contain" />
            <Text style={styles.barcodeRawText}>{shortId || sample.short_id || sampleId || sample.sample_id}</Text>
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
  labelPatient: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 14, textAlign: 'center' },

  /* Key–value rows inside the label */
  labelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  labelRowKey: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  labelRowVal: { fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right' },
  shortCodeText: { fontSize: 20, color: '#2563eb' },

  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  labelTopRow: { flexDirection: 'row', width: '100%', alignItems: 'flex-start', marginBottom: 4 },
  labelFields: { flex: 1, paddingRight: 12 },

  qrBlock: { alignItems: 'center' },
  qrImage: { width: 80, height: 80 },
  qrLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700', textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },

  barcodeSubtitle: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  barcodeImage: { width: 280, height: 80 },
  barcodeRawText: { fontFamily: 'monospace', fontSize: 11, color: '#475569', marginTop: 6 },

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
