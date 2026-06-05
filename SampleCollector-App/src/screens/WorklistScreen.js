import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '../api';

const TUBE_COLORS = {
  'EDTA':   '#7c3aed',
  'Purple': '#7c3aed',
  'Red':    '#dc2626',
  'Blue':   '#2563eb',
  'Green':  '#16a34a',
  'Yellow': '#ca8a04',
  'Grey':   '#6b7280',
  'Gray':   '#6b7280',
};

function TubeChip({ color }) {
  const bg = TUBE_COLORS[color] || '#64748b';
  return (
    <View style={[styles.tubeChip, { backgroundColor: bg }]}>
      <Text style={styles.tubeChipText}>{color || '—'}</Text>
    </View>
  );
}

export default function WorklistScreen({ navigation }) {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWorklist = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const branchId = await SecureStore.getItemAsync('branch_id');
      const token = await SecureStore.getItemAsync('hims_token');
      const data = await apiFetch(
        `/api/lab/worklist?branch_id=${branchId}&status=Pending`,
        {},
        token
      );
      if (data && Array.isArray(data.worklist)) {
        setSamples(data.worklist);
      } else if (data && Array.isArray(data)) {
        setSamples(data);
      }
    } catch {
      Alert.alert('Error', 'Failed to load worklist.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorklist();
    }, [])
  );

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('hims_token');
    await SecureStore.deleteItemAsync('branch_id');
    await SecureStore.deleteItemAsync('user_id');
    navigation.replace('Login');
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Image
          source={require('../Asset/jhlogo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SampleDetail', { sample: item })}
      activeOpacity={0.75}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patient_name}
          </Text>
          <TubeChip color={item.tube_color} />
        </View>
        {(item.sample_id || item.short_id) ? (
          <Text style={styles.sampleId} numberOfLines={1}>
            {item.sample_id || item.short_id}
          </Text>
        ) : null}
        <View style={styles.cardBottom}>
          <Text style={styles.testName} numberOfLines={1}>
            {item.test_name}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading samples...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Count bar */}
      <View style={styles.countBar}>
        <View style={styles.countPill}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>
            {samples.length} Pending Sample{samples.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={samples}
        keyExtractor={(item, i) => String(item.bill_item_id || item.sample_id || i)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWorklist(true)}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>No pending samples at this time.</Text>
          </View>
        }
        contentContainerStyle={samples.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 4 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

  headerLogo: {
    width: 30,
    height: 30,
    marginLeft: 4,
    borderRadius: 15,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  countBar: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  countText: { color: '#1d4ed8', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardAccent: {
    width: 4,
    backgroundColor: '#2563eb',
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  sampleId: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: '#93c5fd',
    fontWeight: '300',
    lineHeight: 24,
  },
  tubeChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tubeChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12, color: '#93c5fd' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0d2554', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
