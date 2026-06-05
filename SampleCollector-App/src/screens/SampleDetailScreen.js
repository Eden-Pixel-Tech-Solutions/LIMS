import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import { apiFetch } from '../api';

export default function SampleDetailScreen({ route, navigation }) {
  const { sample } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

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

  // Keep a ref so the header button always calls the latest handlePrint
  const handlePrintRef = useRef(null);

  // Wire Print button into the navigation header whenever barcode becomes available
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: barcodeUri
        ? () => (
          <TouchableOpacity
            onPress={() => handlePrintRef.current?.()}
            style={styles.headerPrintBtn}
          >
            <Text style={[styles.headerPrintText, { fontSize: isTablet ? 15 : 13 }]}>
              Print Label
            </Text>
          </TouchableOpacity>
        )
        : undefined,
    });
  }, [navigation, barcodeUri, isTablet]);

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
          <div style="text-align:right;font-size:4pt;color:#bbb;margin-top:0.5mm;letter-spacing:0.3pt;">Meril LIMS</div>
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html });
    } catch {
      Alert.alert('Print Error', 'Could not open print dialog.');
    }
  };

  // Always keep the ref current so the header button has the latest closure
  handlePrintRef.current = handlePrint;

  const resolvedSampleId = sampleId || sample.sample_id;
  const resolvedShortId  = shortId  || sample.short_id;

  // Responsive sizing
  const pad = isTablet ? 24 : 16;
  const barcodeImgWidth = Math.min(width - (isTablet ? 160 : 100), isTablet ? 560 : 320);
  const qrSize = isTablet ? 100 : 80;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Centering wrapper for tablet */}
      <View style={[styles.inner, { padding: pad, maxWidth: isTablet ? 800 : undefined, alignSelf: isTablet ? 'center' : 'stretch', width: '100%' }]}>

        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardHeaderText, { fontSize: isTablet ? 12 : 11 }]}>PATIENT INFO</Text>
            <View style={[styles.statusBadge, acknowledged ? styles.badgeGreen : styles.badgePending]}>
              <View style={[styles.statusDot, acknowledged ? styles.dotGreen : styles.dotBlue]} />
              <Text style={[styles.statusText, acknowledged ? styles.textGreen : styles.textBlue, { fontSize: isTablet ? 13 : 12 }]}>
                {acknowledged ? 'Collected' : sample.status || 'Pending'}
              </Text>
            </View>
          </View>

          <View style={[styles.cardBody, { padding: isTablet ? 22 : 18 }]}>
            <View style={styles.fullRow}>
              <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Patient Name</Text>
              <Text style={[styles.patientNameVal, { fontSize: isTablet ? 24 : 20 }]}>{sample.patient_name}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.gridCell}>
                <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Test</Text>
                <Text style={[styles.fieldVal, { fontSize: isTablet ? 15 : 14 }]} numberOfLines={2}>{sample.test_name || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Tube Type</Text>
                <Text style={[styles.fieldVal, { fontSize: isTablet ? 15 : 14 }]}>{sample.tube_color || '—'}</Text>
              </View>
              {sample.test_code ? (
                <View style={styles.gridCell}>
                  <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Test Code</Text>
                  <Text style={[styles.fieldVal, styles.mono, { fontSize: isTablet ? 15 : 14 }]}>{sample.test_code}</Text>
                </View>
              ) : null}
              {resolvedShortId ? (
                <View style={styles.gridCell}>
                  <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Short Code</Text>
                  <Text style={[styles.fieldVal, styles.mono, styles.shortCode, { fontSize: isTablet ? 22 : 18 }]}>{resolvedShortId}</Text>
                </View>
              ) : null}
            </View>

            {resolvedSampleId ? (
              <View style={styles.sampleIdRow}>
                <Text style={[styles.fieldKey, { fontSize: isTablet ? 12 : 11 }]}>Sample ID</Text>
                <Text style={[styles.fieldVal, styles.mono, styles.sampleIdText, { fontSize: isTablet ? 13 : 12 }]} numberOfLines={2} adjustsFontSizeToFit>
                  {resolvedSampleId}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Acknowledge */}
        {!acknowledged && (
          <TouchableOpacity
            style={[styles.ackButton, { padding: isTablet ? 22 : 18, borderRadius: isTablet ? 16 : 14 }]}
            onPress={handleAcknowledge}
            disabled={acknowledging}
            activeOpacity={0.85}
          >
            {acknowledging
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.ackButtonText, { fontSize: isTablet ? 18 : 16 }]}>Mark as Collected</Text>
            }
          </TouchableOpacity>
        )}

        {/* Load Barcode */}
        {acknowledged && !barcodeUri && !loadingBarcode && (
          <TouchableOpacity
            style={[styles.loadBarcodeBtn, { padding: isTablet ? 20 : 16, borderRadius: isTablet ? 16 : 14 }]}
            onPress={() => fetchBarcode()}
            activeOpacity={0.8}
          >
            <Text style={[styles.loadBarcodeBtnText, { fontSize: isTablet ? 17 : 15 }]}>Load Barcode Label</Text>
          </TouchableOpacity>
        )}

        {loadingBarcode && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingLabel, { fontSize: isTablet ? 15 : 13 }]}>Generating barcode...</Text>
          </View>
        )}

        {/* Barcode Label Card */}
        {barcodeUri && (
          <View style={styles.barcodeCard}>
            <View style={styles.barcodeHeader}>
              <View>
                <Text style={[styles.barcodeHeaderSub, { fontSize: isTablet ? 12 : 11 }]}>SAMPLE LABEL</Text>
                <Text style={[styles.barcodeHeaderName, { fontSize: isTablet ? 20 : 17, maxWidth: isTablet ? 400 : 200 }]}>
                  {sample.patient_name}
                </Text>
              </View>
              <Image
                source={require('../Asset/meril.png')}
                style={[styles.merilLogoSmall, { width: isTablet ? 70 : 52, height: isTablet ? 24 : 18 }]}
                resizeMode="contain"
              />
            </View>

            <View style={[styles.labelBody, { margin: isTablet ? 22 : 18, padding: isTablet ? 22 : 18 }]}>
              <View style={styles.labelTopRow}>
                <View style={styles.labelFields}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.labelRowKey, { fontSize: isTablet ? 12 : 11, minWidth: isTablet ? 90 : 72 }]}>Patient</Text>
                    <Text style={[styles.labelRowVal, styles.labelPatientVal, { fontSize: isTablet ? 16 : 14 }]} numberOfLines={1}>
                      {sample.patient_name}
                    </Text>
                  </View>
                  <View style={styles.labelRow}>
                    <Text style={[styles.labelRowKey, { fontSize: isTablet ? 12 : 11, minWidth: isTablet ? 90 : 72 }]}>Sample ID</Text>
                    <Text style={[styles.labelRowVal, styles.mono, { fontSize: isTablet ? 13 : 12 }]} numberOfLines={2} adjustsFontSizeToFit>
                      {resolvedSampleId || '—'}
                    </Text>
                  </View>
                  <View style={styles.labelRow}>
                    <Text style={[styles.labelRowKey, { fontSize: isTablet ? 12 : 11, minWidth: isTablet ? 90 : 72 }]}>Short Code</Text>
                    <Text style={[styles.labelRowVal, styles.mono, styles.shortCodeBig, { fontSize: isTablet ? 24 : 20 }]}>
                      {resolvedShortId || '—'}
                    </Text>
                  </View>
                  {sample.test_code ? (
                    <View style={styles.labelRow}>
                      <Text style={[styles.labelRowKey, { fontSize: isTablet ? 12 : 11, minWidth: isTablet ? 90 : 72 }]}>Test Code</Text>
                      <Text style={[styles.labelRowVal, styles.mono, { fontSize: isTablet ? 13 : 12 }]}>{sample.test_code}</Text>
                    </View>
                  ) : null}
                </View>

                {qrUri && (
                  <View style={styles.qrBlock}>
                    <Image source={{ uri: qrUri }} style={{ width: qrSize, height: qrSize }} resizeMode="contain" />
                    <Text style={[styles.qrLabel, { fontSize: isTablet ? 10 : 9 }]}>Full ID</Text>
                  </View>
                )}
              </View>

              <View style={styles.dividerLine} />

              <Text style={[styles.barcodeSubtitle, { fontSize: isTablet ? 11 : 10 }]}>BARCODE · SHORT CODE</Text>
              <Image
                source={{ uri: barcodeUri }}
                style={{ width: barcodeImgWidth, height: isTablet ? 100 : 80 }}
                resizeMode="contain"
              />
              <Text style={[styles.barcodeRawText, { fontSize: isTablet ? 13 : 11 }]}>{resolvedShortId || resolvedSampleId}</Text>
              <Text style={[styles.merilLimsTag, { fontSize: isTablet ? 10 : 9 }]}>Meril LIMS</Text>
            </View>

            {sample.test_name && (
              <View style={[styles.testChip, { marginHorizontal: isTablet ? 22 : 18, marginBottom: isTablet ? 22 : 18 }]}>
                <Text style={[styles.testChipLabel, { fontSize: isTablet ? 11 : 10 }]}>TEST</Text>
                <Text style={[styles.testChipName, { fontSize: isTablet ? 15 : 13 }]}>{sample.test_name}</Text>
              </View>
            )}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  inner: {},

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
  cardHeaderText: { color: '#93c5fd', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
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
  statusText: { fontWeight: '700' },
  textBlue: { color: '#1d4ed8' },
  textGreen: { color: '#15803d' },

  cardBody: {},
  fullRow: { marginBottom: 14 },
  fieldKey: {
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  patientNameVal: { fontWeight: '900', color: '#0f172a' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  gridCell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldVal: { fontWeight: '700', color: '#1e293b' },
  mono: { fontFamily: 'monospace' },
  shortCode: { color: '#2563eb' },

  sampleIdRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleIdText: { color: '#475569' },

  ackButton: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ackButtonText: { color: '#fff', fontWeight: '800' },

  loadBarcodeBtn: {
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  loadBarcodeBtnText: { color: '#2563eb', fontWeight: '700' },

  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    elevation: 2,
  },
  loadingLabel: { color: '#64748b', fontWeight: '500' },

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
  barcodeHeaderSub: { color: '#38bdf8', fontWeight: '700', letterSpacing: 1.5 },
  barcodeHeaderName: { color: '#fff', fontWeight: '900', marginTop: 2 },
  merilLogoSmall: { opacity: 0.9 },

  labelBody: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
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
  labelRowKey: { fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  labelRowVal: { fontWeight: '700', color: '#0f172a', flex: 1, textAlign: 'right' },
  labelPatientVal: { fontWeight: '800', color: '#0f172a' },
  shortCodeBig: { color: '#2563eb' },

  qrBlock: { alignItems: 'center' },
  qrLabel: { color: '#94a3b8', fontWeight: '700', textAlign: 'center', marginTop: 2, textTransform: 'uppercase' },

  dividerLine: { width: '100%', height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 },

  barcodeSubtitle: { fontWeight: '700', color: '#94a3b8', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  barcodeRawText: { fontFamily: 'monospace', color: '#475569', marginTop: 6 },
  merilLimsTag: { color: '#cbd5e1', fontWeight: '600', letterSpacing: 0.5, marginTop: 6 },

  testChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testChipLabel: { color: '#60a5fa', fontWeight: '700', letterSpacing: 0.5 },
  testChipName: { fontWeight: '700', color: '#1e40af' },

  headerPrintBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 4,
  },
  headerPrintText: { color: '#fff', fontWeight: '700' },
});
