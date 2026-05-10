import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

// ── Color Palette ──────────────────────────────────────────────────────────────
const COLORS = {
  navyDeep: '#0A1628',
  navyMid: '#0D2144',
  royalBlue: '#1A4B9C',
  accentBlue: '#2D7DD2',
  skyBlue: '#5BA4E6',
  iceBlue: '#E8F2FC',
  white: '#FFFFFF',
  offWhite: '#F5F8FD',
  border: '#C8DCF5',
  inputBg: '#FAFCFF',
  labelGray: '#4A6080',
  errorRed: '#D94F4F',
  successGreen: '#2E9E6B',
  mutedText: '#7A95B5',
};

// ── Hex Dot Grid Background ────────────────────────────────────────────────────
function HexGrid() {
  const dots = [];
  const cols = 10;
  const rows = 22;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (width / (cols - 1));
      const y = r * 28 + (c % 2 === 0 ? 0 : 14);
      dots.push({ x, y, key: `${r}-${c}` });
    }
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map(d => (
        <View
          key={d.key}
          style={[
            hexStyles.dot,
            { left: d.x - 1.5, top: d.y - 1.5 },
          ]}
        />
      ))}
    </View>
  );
}
const hexStyles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(45, 125, 210, 0.18)',
  },
});

// ── DNA / Lab Icon ─────────────────────────────────────────────────────────────
function LabIcon({ size = 56 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: COLORS.skyBlue,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(26,75,156,0.12)',
      }}>
        {/* Inner ring */}
        <View style={{
          width: size * 0.68,
          height: size * 0.68,
          borderRadius: (size * 0.68) / 2,
          borderWidth: 2,
          borderColor: COLORS.accentBlue,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(26,75,156,0.18)',
        }}>
          {/* Cross / plus shape */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 3, height: size * 0.32, backgroundColor: COLORS.white, borderRadius: 2 }} />
            <View style={{ width: size * 0.32, height: 3, backgroundColor: COLORS.white, borderRadius: 2, position: 'absolute' }} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Animated Input Field ───────────────────────────────────────────────────────
interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  icon: string;
  delay?: number;
}
function FloatingInput({
  label, value, onChangeText, placeholder,
  secureTextEntry, keyboardType, autoCapitalize, icon, delay = 0,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.accentBlue],
  });
  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim, marginBottom: 20 }}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[
        inputStyles.wrapper,
        { borderColor, shadowOpacity, shadowColor: COLORS.accentBlue, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: focused ? 4 : 0 },
      ]}>
        <Text style={inputStyles.icon}>{icon}</Text>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mutedText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPass}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={inputStyles.eyeBtn}>
            <Text style={inputStyles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Animated.View>
  );
}
const inputStyles = StyleSheet.create({
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 1.1,
    color: COLORS.labelGray,
    textTransform: 'uppercase',
    marginBottom: 7,
    marginLeft: 2,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  icon: {
    fontSize: 17,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    color: COLORS.navyDeep,
    letterSpacing: 0.2,
  },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },
  eyeIcon: { fontSize: 16 },
});

// ── Main Login Screen ──────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(titleAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your credentials to continue.');
      return;
    }

    setLoading(true);
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      // Call backend authentication API
      const response = await fetch('http://172.16.11.160:7005/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token
        await api.setToken(data.token);

        Alert.alert('Success', `Welcome ${data.firstName} - Login successful!`, [
          { text: 'OK', onPress: () => router.replace('/dashboard') }
        ]);
      } else {
        Alert.alert('Authentication Failed', data.message || 'Invalid email or password. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      {/* ── Header Band ─── */}
      <View style={styles.header}>
        <HexGrid />

        {/* Decorative arcs */}
        <View style={styles.arcOuter} />
        <View style={styles.arcInner} />

        {/* Logo */}
        <Animated.View style={[
          styles.logoWrap,
          { opacity: logoAnim, transform: [{ scale: logoAnim }] },
        ]}>
          <LabIcon size={64} />
        </Animated.View>

        {/* Brand */}
        <Animated.View style={{ opacity: titleAnim, alignItems: 'center', marginTop: 14 }}>
          <Text style={styles.brandName}>Meril - LIS</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Meril</Text>
            </View>
            <Text style={styles.brandSub}>Meril's Laboratory Information System</Text>
          </View>
        </Animated.View>

        {/* Divider line */}
        <View style={styles.headerDivider} />
      </View>

      {/* ── Card ─── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.card,
          { transform: [{ translateY: cardAnim }], opacity: cardFade },
        ]}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Access your lab dashboard securely</Text>

          <View style={styles.divider} />

          <FloatingInput
            label="User ID / Email"
            value={email}
            onChangeText={setEmail}
            placeholder="staff@laboratory.org"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="✉️"
            delay={100}
          />

          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            icon="🔒"
            delay={200}
          />

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login button */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnLoading]}
              onPress={handleLogin}
              activeOpacity={0.88}
            >
              <View style={styles.loginBtnInner}>
                {loading ? (
                  <Text style={styles.loginBtnText}>Authenticating…</Text>
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Sign In</Text>
                    <Text style={styles.loginBtnArrow}>→</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer note */}
          <View style={styles.footerNote}>
            <View style={styles.lockDot} />
            <Text style={styles.footerNoteText}>
              Secured with end-to-end encryption · HIPAA compliant
            </Text>
          </View>
        </Animated.View>

        {/* Version tag */}
        <Text style={styles.versionTag}>v2.4.1  ·  Build 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Global Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },

  /* Header */
  header: {
    backgroundColor: COLORS.navyDeep,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 36,
    alignItems: 'center',
    overflow: 'hidden',
  },
  arcOuter: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: width * 1.4,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.navyMid,
    opacity: 0.55,
  },
  arcInner: {
    position: 'absolute',
    bottom: -110,
    left: width * 0.15,
    width: width * 0.9,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.royalBlue,
    opacity: 0.22,
  },
  logoWrap: {
    marginBottom: 4,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  badge: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  brandSub: {
    color: COLORS.skyBlue,
    fontSize: 11.5,
    letterSpacing: 0.6,
    fontWeight: '500',
  },
  headerDivider: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accentBlue,
    marginTop: 18,
    opacity: 0.7,
  },

  /* Scroll / Card */
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.iceBlue,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navyDeep,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.iceBlue,
    marginVertical: 22,
  },

  /* Forgot */
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    marginTop: -8,
  },
  forgotText: {
    color: COLORS.accentBlue,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* Login Button */
  loginBtn: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnLoading: {
    backgroundColor: COLORS.accentBlue,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  loginBtnArrow: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  /* Footer note */
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  lockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.successGreen,
  },
  footerNoteText: {
    fontSize: 10.5,
    color: COLORS.mutedText,
    letterSpacing: 0.1,
  },

  /* Version */
  versionTag: {
    marginTop: 20,
    color: COLORS.mutedText,
    fontSize: 10,
    letterSpacing: 0.8,
    opacity: 0.7,
  },
});