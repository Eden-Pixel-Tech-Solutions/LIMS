import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Sidebar from '../components/Sidebar';
import api, { DashboardStats, ActivityEntry } from '../services/api';

const { width } = Dimensions.get('window');

// ── Palette (matches LoginScreen) ─────────────────────────────────────────────
const C = {
  navyDeep:      '#0A1628',
  navyMid:       '#0D2144',
  royalBlue:     '#1A4B9C',
  accentBlue:    '#2D7DD2',
  skyBlue:       '#5BA4E6',
  iceBlue:       '#E8F2FC',
  white:         '#FFFFFF',
  offWhite:      '#F0F4FA',
  border:        '#D4E4F7',
  labelGray:     '#4A6080',
  mutedText:     '#7A95B5',
  successGreen:  '#1E8A5E',
  successLight:  '#E6F7F1',
  warningAmber:  '#B45309',
  warningLight:  '#FEF3C7',
  dangerRed:     '#C0392B',
  dangerLight:   '#FEE8E8',
  infoLight:     '#EBF4FF',
};

// ── SVG-style Icon Components ──────────────────────────────────────────────────
function IconWorklist({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 6, 12].map(y => (
        <View key={y} style={{ width: 18, height: 2.5, backgroundColor: color, borderRadius: 2, marginBottom: y < 12 ? 4 : 0 }} />
      ))}
    </View>
  );
}
function IconVerify({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 8, height: 5, borderLeftWidth: 2.5, borderBottomWidth: 2.5, borderColor: color, transform: [{ rotate: '-45deg' }, { translateY: -1 }] }} />
      </View>
    </View>
  );
}
function IconDownload({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 10, height: 10, borderRightWidth: 2.5, borderBottomWidth: 2.5, borderColor: color, transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
      <View style={{ width: 2.5, height: 12, backgroundColor: color, borderRadius: 2, marginTop: -4 }} />
      <View style={{ width: 16, height: 2.5, backgroundColor: color, borderRadius: 2, marginTop: 3 }} />
    </View>
  );
}
function IconFlask({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 10, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ width: 2.5, height: 7, backgroundColor: color, borderRadius: 2, marginLeft: -3 }} />
      <View style={{ width: 16, height: 8, borderRadius: 8, backgroundColor: color, marginTop: 1 }} />
    </View>
  );
}
function IconPatient({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: color }} />
      <View style={{ width: 16, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 2.5, borderBottomWidth: 0, borderColor: color, marginTop: 2 }} />
    </View>
  );
}
function IconBilling({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 2.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, color, fontWeight: '800', marginTop: -1 }}>$</Text>
      </View>
    </View>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  accentColor: string;
  bgColor: string;
  delay: number;
}
function StatCard({ title, value, change, positive, accentColor, bgColor, delay }: StatCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[
      statStyles.card,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
    ]}>
      <View style={[statStyles.accentBar, { backgroundColor: accentColor }]} />
      <View style={statStyles.inner}>
        <Text style={statStyles.title}>{title}</Text>
        <Text style={statStyles.value}>{value}</Text>
        <View style={[statStyles.badge, { backgroundColor: bgColor }]}>
          <Text style={[statStyles.change, { color: accentColor }]}>{change}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
const statStyles = StyleSheet.create({
  card: {
    width: (width - 52) / 2,
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.accentBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  accentBar: { width: 4, borderRadius: 0 },
  inner: { flex: 1, padding: 14 },
  title: { fontSize: 11, color: C.mutedText, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  value: { fontSize: 22, fontWeight: '800', color: C.navyDeep, marginTop: 4, letterSpacing: -0.5 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  change: { fontSize: 11, fontWeight: '700' },
});

// ── Menu Item ──────────────────────────────────────────────────────────────────
interface MenuItemProps {
  title: string;
  subtitle: string;
  IconComp: React.ComponentType<{ color: string }>;
  accentColor: string;
  lightColor: string;
  onPress: () => void;
  delay: number;
}
function MenuItem({ title, subtitle, IconComp, accentColor, lightColor, onPress, delay }: MenuItemProps) {
  const anim   = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
  }, []);
  const onPressIn  = () => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scaleA, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
        { scale: scaleA },
      ],
      marginBottom: 10,
    }}>
      <TouchableOpacity
        style={[menuStyles.item, { borderLeftColor: accentColor }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[menuStyles.iconWrap, { backgroundColor: lightColor }]}>
          <IconComp color={accentColor} />
        </View>
        <View style={menuStyles.textBlock}>
          <Text style={menuStyles.title}>{title}</Text>
          <Text style={menuStyles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={[menuStyles.arrowWrap, { backgroundColor: lightColor }]}>
          <View style={{ width: 7, height: 7, borderTopWidth: 2, borderRightWidth: 2, borderColor: accentColor, transform: [{ rotate: '45deg' }] }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
const menuStyles = StyleSheet.create({
  item: {
    backgroundColor: C.white,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.accentBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textBlock: { flex: 1, marginRight: 10 },
  title:    { fontSize: 15, fontWeight: '700', color: C.navyDeep, letterSpacing: 0.1 },
  subtitle: { fontSize: 12, color: C.mutedText, marginTop: 2 },
  arrowWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

// ── Activity Feed ──────────────────────────────────────────────────────────────
function ActivityRow({ label, time, dotColor, bgColor }: ActivityEntry) {
  return (
    <View style={actStyles.row}>
      <View style={[actStyles.dot, { backgroundColor: dotColor }]} />
      <View style={actStyles.content}>
        <Text style={actStyles.label}>{label}</Text>
        <Text style={actStyles.time}>{time}</Text>
      </View>
      <View style={[actStyles.pill, { backgroundColor: bgColor }]}>
        <View style={[actStyles.pillDot, { backgroundColor: dotColor }]} />
      </View>
    </View>
  );
}
const actStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: C.iceBlue,
  },
  dot:     { width: 8, height: 8, borderRadius: 4, marginRight: 12, flexShrink: 0 },
  content: { flex: 1 },
  label:   { fontSize: 13.5, fontWeight: '500', color: C.navyDeep },
  time:    { fontSize: 11, color: C.mutedText, marginTop: 2 },
  pill:    { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
});

// ── Header Hex dots ────────────────────────────────────────────────────────────
function HexBg() {
  const dots = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 14; c++)
      dots.push({ key: `${r}${c}`, x: c * (width / 12) + (r % 2 === 0 ? 0 : (width / 24)), y: r * 24 });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map(d => (
        <View key={d.key} style={{ position: 'absolute', left: d.x, top: d.y, width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(91,164,230,0.15)' }} />
      ))}
    </View>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityEntry[]>([]);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.getDashboardStats();
      if (response.success && response.data) {
        setStatsData(response.data.stats);
        setActivityData(response.data.activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const stats = statsData ? [
    { title: 'Total Tests',       value: statsData.totalTests.today.toString(),   change: `${statsData.totalTests.change >= 0 ? '↑' : '↓'} ${Math.abs(statsData.totalTests.change)}% today`, positive: statsData.totalTests.positive,  accentColor: C.royalBlue,   bgColor: C.infoLight },
    { title: "Today's Patients",  value: statsData.todayPatients.value.toString(),    change: `${statsData.todayPatients.change >= 0 ? '↑' : '↓'} ${Math.abs(statsData.todayPatients.change)}% today`,  positive: statsData.todayPatients.positive,  accentColor: C.successGreen,bgColor: C.successLight },
    { title: 'Pending Reports',   value: statsData.pendingReports.value.toString(),    change: `${statsData.pendingReports.change <= 0 ? '↓' : '↑'} ${Math.abs(statsData.pendingReports.change)} pending`, positive: statsData.pendingReports.positive, accentColor: C.warningAmber,bgColor: C.warningLight },
    { title: 'Revenue Today',     value: formatCurrency(statsData.revenue.value),change: `${statsData.revenue.change >= 0 ? '↑' : '↓'} ${Math.abs(statsData.revenue.change)}% today`, positive: statsData.revenue.positive,  accentColor: C.successGreen,bgColor: C.successLight },
  ] : [];

  const menuItems = [
    { id: 'worklist',       title: 'Laboratory Worklist',  subtitle: 'Sample collection & worklist management',    Icon: IconWorklist, accent: C.royalBlue,    light: C.infoLight,      route: '/worklist' },
    { id: 'verification',  title: 'Test Verification',    subtitle: 'Lab Head Doctor – test verification',        Icon: IconVerify,   accent: C.successGreen,  light: C.successLight,   route: '/verification' },
    { id: 'report-dl',     title: 'Report Download',      subtitle: 'Download approved lab test reports',         Icon: IconDownload, accent: C.accentBlue,    light: '#EBF6FF',         route: '/report-download' },
    { id: 'lab-settings',  title: 'Lab Settings',         subtitle: 'Tests, categories, containers & types',      Icon: IconFlask,    accent: '#0E7490',        light: '#E0F7FA',         route: '/lab-settings' },
    { id: 'patients',      title: 'Patient Management',   subtitle: 'View and manage patient records',            Icon: IconPatient,  accent: C.warningAmber,  light: C.warningLight,   route: null },
    { id: 'billing',       title: 'Billing & Invoices',   subtitle: 'Manage billing and generate invoices',       Icon: IconBilling,  accent: C.dangerRed,     light: C.dangerLight,    route: null },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navyDeep} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <HexBg />
        <View style={styles.arcOuter} />
        <View style={styles.arcInner} />

        <Animated.View style={[styles.headerRow, { opacity: headerAnim }]}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.hamburger}>
            <View style={styles.hLine} /><View style={[styles.hLine, { width: 14 }]} /><View style={styles.hLine} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.welcomeLabel}>Good morning,</Text>
            <Text style={styles.doctorName}>Dr. Steve</Text>
          </View>

          <TouchableOpacity onPress={() => router.replace('/')} style={styles.logoutBtn}>
            <View style={styles.logoutIcon}>
              <View style={{ width: 10, height: 10, borderWidth: 2, borderColor: C.white, borderRadius: 5 }} />
              <View style={{ width: 6, height: 2, backgroundColor: C.white, position: 'absolute', right: -2 }} />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Date badge */}
        <Animated.View style={[styles.dateBadge, { opacity: headerAnim }]}>
          <View style={styles.dateDot} />
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </Animated.View>

        {/* Summary pill row */}
        <Animated.View style={[styles.pillRow, { opacity: headerAnim }]}>
          {[['248', 'Tests'], ['42', 'Patients'], ['15', 'Pending']].map(([v, l]) => (
            <View key={l} style={styles.pill}>
              <Text style={styles.pillValue}>{v}</Text>
              <Text style={styles.pillLabel}>{l}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} delay={i * 60} />
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {menuItems.map((m, i) => (
          <MenuItem
            key={m.id}
            title={m.title}
            subtitle={m.subtitle}
            IconComp={m.Icon}
            accentColor={m.accent}
            lightColor={m.light}
            onPress={() => m.route ? router.push(m.route as any) : null}
            delay={i * 55 + 200}
          />
        ))}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {activityData.length > 0 ? activityData.map((a, i) => (
            <ActivityRow key={i} {...a} />
          )) : (
            <Text style={{ padding: 20, textAlign: 'center', color: C.mutedText }}>No recent activity</Text>
          )}
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>View all activity →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>LabTrack LIS · v2.4.1 · Build 2026</Text>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.offWhite },

  /* Header */
  header: {
    backgroundColor: C.navyDeep,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  arcOuter: {
    position: 'absolute', bottom: -70, left: -50,
    width: width * 1.3, height: 130, borderRadius: 65,
    backgroundColor: C.navyMid, opacity: 0.5,
  },
  arcInner: {
    position: 'absolute', bottom: -100, left: width * 0.2,
    width: width * 0.85, height: 130, borderRadius: 65,
    backgroundColor: C.royalBlue, opacity: 0.18,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  hamburger: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    gap: 4, marginRight: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  hLine: { width: 18, height: 2, backgroundColor: C.white, borderRadius: 2 },
  headerCenter: { flex: 1 },
  welcomeLabel: { color: C.skyBlue, fontSize: 12, fontWeight: '500', letterSpacing: 0.4 },
  doctorName:   { color: C.white,   fontSize: 22, fontWeight: '800', letterSpacing: 0.2, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  logoutIcon: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: C.white, fontSize: 11.5, fontWeight: '600', letterSpacing: 0.3 },

  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 18,
  },
  dateDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.accentBlue },
  dateText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 0.3 },

  pillRow: {
    flexDirection: 'row', gap: 10,
  },
  pill: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  pillValue: { color: C.white, fontSize: 18, fontWeight: '800' },
  pillLabel: { color: C.skyBlue, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 2 },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.labelGray,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14,
  },

  /* Stats grid */
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 28,
  },

  /* Activity */
  activityCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    shadowColor: C.accentBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  viewAllBtn: { paddingVertical: 12, alignItems: 'center' },
  viewAllText: { fontSize: 12.5, color: C.accentBlue, fontWeight: '700', letterSpacing: 0.3 },

  footer: {
    textAlign: 'center', fontSize: 10, color: C.mutedText,
    letterSpacing: 0.8, opacity: 0.7, marginBottom: 8,
  },
});