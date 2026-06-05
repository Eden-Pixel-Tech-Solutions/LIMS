import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../api';

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (data.token) {
        await SecureStore.setItemAsync('hims_token', data.token);
        await SecureStore.setItemAsync('branch_id', String(data.branch_id || ''));
        await SecureStore.setItemAsync('user_id', String(data.id || ''));
        navigation.replace('Worklist');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const r = isTablet ? 1.25 : 1; // scale factor for tablet

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { maxWidth: isTablet ? 560 : 420, padding: isTablet ? 40 : 28 }]}>

          {/* Logos */}
          <View style={styles.logosRow}>
            <Image
              source={require('../Asset/jhlogo.png')}
              style={{ width: 72 * r, height: 72 * r }}
              resizeMode="contain"
            />
            <View style={[styles.logoDivider, { height: 52 * r }]} />
            <Image
              source={require('../Asset/meril.png')}
              style={{ width: 110 * r, height: 38 * r }}
              resizeMode="contain"
            />
          </View>

          {/* Identity */}
          <Text style={[styles.govText, { fontSize: isTablet ? 14 : 12 }]}>
            Government of Jharkhand
          </Text>
          <Text style={[styles.appTitle, { fontSize: isTablet ? 32 : 26 }]}>
            SAMPLE COLLECTOR
          </Text>
          <Text style={[styles.appSubtitle, { fontSize: isTablet ? 14 : 12 }]}>
            Health Information Management System
          </Text>

          <View style={styles.divider} />

          {/* Email */}
          <Text style={[styles.fieldLabel, { fontSize: isTablet ? 13 : 12 }]}>Email Address</Text>
          <TextInput
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
              { fontSize: isTablet ? 17 : 15, paddingVertical: isTablet ? 17 : 14 },
            ]}
            placeholder="Enter your email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />

          {/* Password */}
          <Text style={[styles.fieldLabel, { fontSize: isTablet ? 13 : 12 }]}>Password</Text>
          <TextInput
            style={[
              styles.input,
              passFocused && styles.inputFocused,
              { fontSize: isTablet ? 17 : 15, paddingVertical: isTablet ? 17 : 14 },
            ]}
            placeholder="Enter your password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
          />

          {/* Login button */}
          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
              { paddingVertical: isTablet ? 20 : 16, borderRadius: isTablet ? 14 : 12 },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.buttonText, { fontSize: isTablet ? 18 : 16 }]}>Login  →</Text>
            }
          </TouchableOpacity>

          <Text style={[styles.hint, { fontSize: isTablet ? 13 : 11 }]}>
            Phlebotomy Portal · Lab Staff Only
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    shadowColor: '#1e40af',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logosRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  logoDivider: { width: 1, backgroundColor: '#e2e8f0' },
  govText: {
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTitle: {
    fontWeight: '900',
    color: '#0d2554',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  appSubtitle: {
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  fieldLabel: {
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#0f172a',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  inputFocused: { borderColor: '#2563eb', backgroundColor: '#EFF6FF' },
  button: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#93c5fd', shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  hint: { color: '#94a3b8', textAlign: 'center', marginTop: 16, fontWeight: '500' },
});
