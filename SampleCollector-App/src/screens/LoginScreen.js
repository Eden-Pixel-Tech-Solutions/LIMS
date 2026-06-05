import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../api';

export default function LoginScreen({ navigation }) {
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
        {/* Card */}
        <View style={styles.card}>

          {/* Logos row */}
          <View style={styles.logosRow}>
            <Image
              source={require('../Asset/jhlogo.png')}
              style={styles.jhLogo}
              resizeMode="contain"
            />
            <View style={styles.logoDivider} />
            <Image
              source={require('../Asset/meril.png')}
              style={styles.merilLogo}
              resizeMode="contain"
            />
          </View>

          {/* App identity */}
          <Text style={styles.govText}>Government of Jharkhand</Text>
          <Text style={styles.appTitle}>SAMPLE COLLECTOR</Text>
          <Text style={styles.appSubtitle}>Health Information Management System</Text>

          <View style={styles.divider} />

          {/* Email */}
          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
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
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={[styles.input, passFocused && styles.inputFocused]}
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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Login  →</Text>
            }
          </TouchableOpacity>

          <Text style={styles.hint}>Phlebotomy Portal · Lab Staff Only</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
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
    gap: 16,
  },
  jhLogo: {
    width: 72,
    height: 72,
  },
  logoDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#e2e8f0',
  },
  merilLogo: {
    width: 100,
    height: 36,
  },

  govText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0d2554',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#2563eb',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 20,
  },

  fieldLabel: {
    fontSize: 12,
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
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: '#2563eb',
    backgroundColor: '#EFF6FF',
  },

  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  hint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});
