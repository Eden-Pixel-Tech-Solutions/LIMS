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
    const barcodeId = id || shortId || sample.short_id || sampleId || sample.sample_id || sample.lab_barcode;
    if (!barcodeId) {
      Alert.alert('No ID', 'No sample ID available. Please acknowledge first.');
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
    } catch {
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
            @page { size: 2.25in 1.25in; margin: 0; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              width: 2.25in; height: 1.25in;
              font-family: 'Courier New', Courier, monospace;
              background: #fff; color: #000;
              padding: 2mm 3mm 1mm 3mm; overflow: hidden;
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
    `;
    try {
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Print Error', 'Could not open print dialog.');
    }
  };

  const resolvedSampleId = sampleId || sample.sample_id;
  const resolvedShortId  = shortId  || sample.short_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Patient Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>PATIENT INFO</Text>
          <View style={[styles.statusBadge, acknowledged ? styles.badgeGreen : styles.badgePending]}>
            <View style={[styles.statusDot, acknowledged ? styles.dotGreen : styles.dotBlue]} />
            <Text style={[styles.statusText, acknowledged ? styles.textGreen : styles.textBlue]}>
              {acknowledged ? 'Collected' : sample.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {/* Patient name — full width */}
          <View style={styles.fullRow}>
            <Text style={styles.fieldKey}>Patient Name</Text>
            <Text style={styles.patientNameVal}>{sample.patient_name}</Text>
          </View>

          {/* Two-column grid */}
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.fieldKey}>Test</Text>
              <Text style={styles.fieldVal} numberOfLines={2}>{sample.test_name || '—'}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.fieldKey}>Tube Type</Text>
              <Text style={styles.fieldVal}>{sample.tube_color || '—'}</Text>
            </View>
            {sample.test_code ? (
              <View style={styles.gridCell}>
                <Text style={styles.fieldKey}>Test Code</Text>
                <Text style={[styles.fieldVal, styles.mono]}>{sample.test_code}</Text>
              </View>
            ) : null}
            {resolvedShortId ? (
              <View style={styles.gridCell}>
                <Text style={styles.fieldKey}>Short Code</Text>
                <Text style={[styles.fieldVal, styles.mono, styles.shortCode]}>{resolvedShortId}</Text>
              </View>
            ) : null}
          </View>

          {resolvedSampleId ? (
            <View style={styles.sampleIdRow}>
              <Text style={styles.fieldKey}>Sample ID</Text>
              <Text style={[styles.fieldVal, styles.mono, styles.sampleIdText]} numberOfLines={2} adjustsFontSizeToFit>
                {resolvedSampleId}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Acknowledge Button */}
      {!acknowledged && (
        <TouchableOpacity
          style={styles.ackButton}
          onPress={handleAcknowledge}
          disabled={acknowledging}
          activeOpacity={0.85}
        >
          {acknowledging
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.btnInner}>
                <Text style={styles.ackButtonText}>Mark as Collected</Text>
              </View>
            )
          }
        </TouchableOpacity>
      )}

      {/* Load Barcode */}
      {acknowledged && !barcodeUri && !loadingBarcode && (
        <TouchableOpacity
          style={styles.loadBarcodeBtn}
          onPress={() => fetchBarcode()}
          activeOpacity={0.8}
        >
          <Text style={styles.loadBarcodeBtnText}>Load Barcode Label</Text>
        </TouchableOpacity>
      )}

      {loadingBarcode && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingLabel}>Generating barcode...</Text>
        </View>
      )}

      {/* Barcode Label Card */}
      {barcodeUri && (
        <View style={styles.barcodeCard}>

          {/* Dark header strip with meril logo */}
          <View style={styles.barcodeHeader}>
            <View>
              <Text style={styles.barcodeHeaderSub}>SAMPLE LABEL</Text>
              <Text style={styles.barcodeHeaderName}>{sample.patient_name}</Text>
            </View>
            <Image
              source={require('../Asset/meril.png')}
              style={styles.merilLogoSmall}
              resizeMode="contain"
            />
          </View>

          {/* Label body */}
          <View style={styles.labelBody}>
            <View style={styles.labelTopRow}>
              {/* Left: text fields */}
              <View style={styles.labelFields}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelRowKey}>Patient</Text>
                  <Text style={[styles.labelRowVal, styles.labelPatientVal]} numberOfLines={1}>
                    {sample.patient_name}
                  </Text>
                </View>
                <View style={styles.labelRow}>
                  <Text style={styles.labelRowKey}>Sample ID</Text>
                  <Text style={[styles.labelRowVal, styles.mono]} numberOfLines={2} adjustsFontSizeToFit>
                    {resolvedSampleId || '—'}
                  </Text>
                </View>
                <View style={styles.labelRow}>
                  <Text style={styles.labelRowKey}>Short Code</Text>
                  <Text style={[styles.labelRowVal, styles.mono, styles.shortCodeBig]}>
                    {resolvedShortId || '—'}
                  </Text>
                </View>
                {sample.test_code ? (
                  <View style={styles.labelRow}>
                    <Text style={styles.labelRowKey}>Test Code</Text>
                    <Text style={[styles.labelRowVal, styles.mono]}>{sample.test_code}</Text>
                  </View>
                ) : null}
              </View>

              {/* Right: QR code */}
              {qrUri && (
                <View style={styles.qrBlock}>
                  <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
                  <Text style={styles.qrLabel}>Full ID</Text>
                </View>
              )}
            </View>

            <View style={styles.dividerLine} />

            <Text style={styles.barcodeSubtitle}>BARCODE · SHORT CODE</Text>
            <Image source={{ uri: barcodeUri }} style={styles.barcodeImage} resizeMode="contain" />
            <Text style={styles.barcodeRawText}>{resolvedShortId || resolvedSampleId}</Text>
          </View>

          {sample.test_name && (
            <View style={styles.testChip}>
              <Text style={styles.testChipLabel}>TEST</Text>
              <Text style={styles.testChipName}>{sample.test_name}</Text>
            </View>
          )}
        </View>
      )}

      {/* Print Button */}
      {barcodeUri && (
        <TouchableOpacity style={styles.printButton} onPress={handlePrint} activeOpacity={0.85}>
          <Text style={styles.printButtonText}>Print Label</Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 16, paddingBottom: 48 },

  /* Info card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: '#0d2554',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  badgePending: { backgroundColor: '#DBEAFE' },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotBlue: { backgroundColor: '#2563eb' },
  dotGreen: { backgroundColor: '#16a34a' },
  statusText: { fontSize: 12, fontWeight: '700' },
  textBlue: { color: '#1d4ed8' },
  textGreen: { color: '#15803d' },

  cardBody: { padding: 18 },

  fullRow: { marginBottom: 14 },
  fieldKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  patientNameVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  mono: { fontFamily: 'monospace' },
  shortCode: { fontSize: 18, color: '#2563eb' },

  sampleIdRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleIdText: { fontSize: 12, color: '#475569' },

  /* Buttons */
  ackButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ackButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  loadBarcodeBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  loadBarcodeBtnText: { color: '#2563eb', fontSize: 15, fontWeight: '700' },

  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  loadingLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },

  /* Barcode card */
  barcodeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  barcodeHeader: {
    backgroundColor: '#0f172a',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barcodeHeaderSub: { color: '#38bdf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  barcodeHeaderName: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 2, maxWidth: 200 },
  merilLogoSmall: { width: 52, height: 18, opacity: 0.9 },

  labelBody: {
    margin: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
  },

  labelTopRow: { flexDirection: 'row', width: '100%', alignItems: 'flex-start', marginBottom: 4 },
  labelFields: { flex: 1, paddingRight: 12 },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  labelRowKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    minWidth: 72,
  },
  labelRowVal: { fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right' },
  labelPatientVal: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  shortCodeBig: { fontSize: 20, color: '#2563eb' },

  qrBlock: { alignItems: 'center' },
  qrImage: { width: 80, height: 80 },
  qrLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  dividerLine: { width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 },

  barcodeSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  barcodeImage: { width: 280, height: 80 },
  barcodeRawText: { fontFamily: 'monospace', fontSize: 11, color: '#475569', marginTop: 6 },

  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testChipLabel: { fontSize: 10, color: '#60a5fa', fontWeight: '700', letterSpacing: 0.5 },
  testChipName: { fontSize: 13, fontWeight: '700', color: '#1e40af' },

  /* Print button */
  printButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  printButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
