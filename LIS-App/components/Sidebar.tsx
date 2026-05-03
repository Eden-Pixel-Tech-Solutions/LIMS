import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

// Color palette
const COLORS = {
  navyDeep:    '#0A1628',
  navyMid:     '#0D2144',
  royalBlue:   '#1A4B9C',
  accentBlue:  '#2D7DD2',
  skyBlue:     '#5BA4E6',
  iceBlue:     '#E8F2FC',
  white:       '#FFFFFF',
  offWhite:    '#F5F8FD',
  border:      '#C8DCF5',
  inputBg:     '#FAFCFF',
  labelGray:   '#4A6080',
  mutedText:   '#7A95B5',
  successGreen:'#2E9E6B',
  warningOrange: '#F59E0B',
  dangerRed:   '#EF4444',
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '🏠',
    route: '/dashboard',
  },
  {
    id: 'worklist',
    title: 'Laboratory Worklist',
    icon: '📋',
    route: '/worklist',
  },
  {
    id: 'verification',
    title: 'Test Verification',
    icon: '✅',
    route: '/verification',
  },
  {
    id: 'report-download',
    title: 'Report Download',
    icon: '📥',
    route: '/report-download',
  },
  {
    id: 'lab-settings',
    title: 'Lab Settings',
    icon: '🧪',
    route: '/lab-settings',
  },
  {
    id: 'patients',
    title: 'Patient Management',
    icon: '👥',
    route: '/patients',
  },
  {
    id: 'reports',
    title: 'Test Reports',
    icon: '📊',
    route: '/reports',
  },
  {
    id: 'billing',
    title: 'Billing & Invoices',
    icon: '💰',
    route: '/billing',
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (route: any) => {
    router.push(route as any);
    onClose();
  };

  const isActive = (route: string) => {
    return pathname === route;
  };

  if (!isOpen) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sidebar}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.logoText}>LabTrack</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isActive(item.route) && styles.activeMenuItem
              ]}
              onPress={() => handleNavigation(item.route)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[
                styles.menuText,
                isActive(item.route) && styles.activeMenuText
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.sidebarFooter}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              router.replace('/');
              onClose();
            }}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    maxWidth: 280,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.navyDeep,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarHeader: {
    backgroundColor: COLORS.navyDeep,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  activeMenuItem: {
    backgroundColor: COLORS.iceBlue,
    borderLeftColor: COLORS.royalBlue,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.labelGray,
    flex: 1,
  },
  activeMenuText: {
    color: COLORS.royalBlue,
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.dangerRed,
    borderRadius: 8,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
