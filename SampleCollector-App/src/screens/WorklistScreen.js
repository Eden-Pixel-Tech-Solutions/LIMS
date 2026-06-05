import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  TextInput, ScrollView,
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
  const [search, setSearch] = useState('');
  const [tubeFilter, setTubeFilter] = useState('All');

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

  // Derive unique tube color options from loaded data
  const tubeOptions = useMemo(() => {
    const colors = [...new Set(samples.map(s => s.tube_color).filter(Boolean))];
    return ['All', ...colors];
  }, [samples]);

  // Apply search + tube filter client-side
  const filteredSamples = useMemo(() => {
    const q = search.trim().toLowerCase();
    return samples.filter(s => {
      const matchSearch = !q ||
        (s.patient_name || '').toLowerCase().includes(q) ||
        (s.test_name || '').toLowerCase().includes(q) ||
        (s.sample_id || '').toLowerCase().includes(q);
      const matchTube = tubeFilter === 'All' || s.tube_color === tubeFilter;
      return matchSearch && matchTube;
    });
  }, [samples, search, tubeFilter]);

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

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient, test or sample ID..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tube filter chips */}
      {tubeOptions.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {tubeOptions.map(opt => {
            const active = tubeFilter === opt;
            const dotColor = opt === 'All' ? '#2563eb' : (TUBE_COLORS[opt] || '#64748b');
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setTubeFilter(opt)}
                activeOpacity={0.7}
              >
                {opt !== 'All' && (
                  <View style={[styles.filterDot, { backgroundColor: dotColor }]} />
                )}
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Count bar */}
      <View style={styles.countBar}>
        <View style={styles.countPill}>
          <View style={styles.countDot} />
          <Text style={styles.countText}>
            {filteredSamples.length}
            {filteredSamples.length !== samples.length ? ` of ${samples.length}` : ''}
            {' '}Pending Sample{filteredSamples.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredSamples}
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
            <Text style={styles.emptyIcon}>{search || tubeFilter !== 'All' ? '🔍' : '✓'}</Text>
            <Text style={styles.emptyTitle}>
              {search || tubeFilter !== 'All' ? 'No matches' : 'All Clear'}
            </Text>
            <Text style={styles.emptyText}>
              {search || tubeFilter !== 'All'
                ? 'Try a different search or filter.'
                : 'No pending samples at this time.'}
            </Text>
          </View>
        }
        contentContainerStyle={filteredSamples.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 4 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

  headerLogo: { width: 30, height: 30, marginLeft: 4, borderRadius: 15 },
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

  /* Search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1e40af',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 18, color: '#94a3b8', marginRight: 6 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  clearBtn: { fontSize: 13, color: '#94a3b8', paddingLeft: 6 },

  /* Filter chips */
  filterRow: { maxHeight: 48 },
  filterContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563eb',
  },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#2563eb' },

  /* Count bar */
  countBar: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 4,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  countDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2563eb' },
  countText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },

  /* Sample cards */
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
  cardAccent: { width: 4, backgroundColor: '#2563eb' },
  cardBody: { flex: 1, padding: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  sampleId: { fontFamily: 'monospace', fontSize: 11, color: '#64748b', marginBottom: 6 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  testName: { fontSize: 13, color: '#475569', fontWeight: '500', flex: 1 },
  chevron: { fontSize: 22, color: '#93c5fd', fontWeight: '300', lineHeight: 24 },
  tubeChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  tubeChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0d2554', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
