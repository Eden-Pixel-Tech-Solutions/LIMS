import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Sidebar from "../components/Sidebar";
import api, { WorklistItem } from "../services/api";

const { width } = Dimensions.get("window");

// Color palette
const COLORS = {
  navyDeep: "#0A1628",
  navyMid: "#0D2144",
  royalBlue: "#1A4B9C",
  accentBlue: "#2D7DD2",
  skyBlue: "#5BA4E6",
  iceBlue: "#E8F2FC",
  white: "#FFFFFF",
  offWhite: "#F5F8FD",
  border: "#C8DCF5",
  inputBg: "#FAFCFF",
  labelGray: "#4A6080",
  mutedText: "#7A95B5",
  successGreen: "#2E9E6B",
  warningOrange: "#F59E0B",
  dangerRed: "#EF4444",
  pendingYellow: "#F59E0B",
};

// State for API data - moved inside component
const useWorklistState = () => {
  const [worklist, setWorklist] = useState<WorklistItem[]>([]);
  const [loading, setLoading] = useState({
    worklist: false,
    acknowledge: false,
  });
  return { worklist, setWorklist, loading, setLoading };
};

const departments = [
  { id: "all", name: "All Departments", icon: "🏥", count: 1 },
  { id: "hematology", name: "Hematology", icon: "🩸", count: 0 },
  { id: "biochemistry", name: "Biochemistry", icon: "🧪", count: 0 },
  { id: "serology", name: "Serology", icon: "🔬", count: 1 },
  { id: "microbiology", name: "Microbiology", icon: "🦠", count: 0 },
];

export default function Worklist() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const { worklist, setWorklist, loading, setLoading } = useWorklistState();

  useEffect(() => {
    fetchWorklist();
  }, [selectedDepartment]);

  const fetchWorklist = async () => {
    setLoading((prev) => ({ ...prev, worklist: true }));
    try {
      const response = await api.getWorklist(selectedDepartment);
      if (response.success && response.worklist) {
        setWorklist(response.worklist);
      }
    } catch (error) {
      console.error("Error fetching worklist:", error);
    } finally {
      setLoading((prev) => ({ ...prev, worklist: false }));
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorklist();
  };

  const getFilteredWorklist = () => {
    if (selectedDepartment === "all") return worklist;
    return worklist.filter(
      (item: WorklistItem) =>
        item.department.toLowerCase() === selectedDepartment.toLowerCase(),
    );
  };

  const getPendingCount = (deptId: string) => {
    if (deptId === "all")
      return worklist.filter((item: WorklistItem) => item.status === "Pending")
        .length;
    const filtered = getFilteredWorklist();
    return filtered.filter((item: WorklistItem) => item.status === "Pending")
      .length;
  };

  const handleAcknowledge = async (billItemId: number) => {
    setLoading((prev: any) => ({ ...prev, acknowledge: true }));
    try {
      // Find the item to acknowledge
      const itemToAcknowledge = worklist.find(
        (item: WorklistItem) => item.bill_item_id === billItemId,
      );
      if (itemToAcknowledge) {
        // Generate sample ID - use YYYYMMDD format (no dashes) to match backend
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const sampleResponse = await api.generateSampleId(today);

        if (sampleResponse.success) {
          await api.acknowledgeTest({
            bill_item_id: itemToAcknowledge.bill_item_id,
            sample_id: sampleResponse.sampleId,
            status: "Collected",
          });

          Alert.alert("Success", "Sample acknowledged successfully!");
          fetchWorklist(); // Refresh worklist
        }
      }
    } catch (error) {
      console.error("Error acknowledging test:", error);
      Alert.alert("Error", "Failed to acknowledge sample");
    } finally {
      setLoading((prev: any) => ({ ...prev, acknowledge: false }));
    }
  };

  const getDepartmentCount = (deptId: string) => {
    if (deptId === "all")
      return worklist.filter((item: WorklistItem) => item.status === "Pending")
        .length;
    return getFilteredWorklist().filter(
      (item: WorklistItem) => item.status === "Pending",
    ).length;
  };

  const filteredWorklist = getFilteredWorklist();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.hamburgerBtn}
        >
          <Text style={styles.hamburgerText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Laboratory Worklist & Sample Collection
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Department Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Department</Text>

          <View style={styles.departmentGrid}>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.departmentCard,
                  selectedDepartment === dept.id &&
                    styles.selectedDepartmentCard,
                ]}
                onPress={() => setSelectedDepartment(dept.id)}
              >
                <Text style={styles.departmentIcon}>{dept.icon}</Text>
                <Text
                  style={[
                    styles.departmentName,
                    selectedDepartment === dept.id &&
                      styles.selectedDepartmentName,
                  ]}
                >
                  {dept.name}
                </Text>
                {getDepartmentCount(dept.id) > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>
                      {getDepartmentCount(dept.id)} pending
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Worklist Header */}
        <View style={styles.worklistHeader}>
          <Text style={styles.worklistTitle}>
            {departments.find((d) => d.id === selectedDepartment)?.name}{" "}
            Worklist
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Worklist Table */}
        <View style={styles.worklistSection}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Patient</Text>
            <Text style={styles.tableHeaderText}>Patient ID</Text>
            <Text style={styles.tableHeaderText}>Test Name</Text>
            <Text style={styles.tableHeaderText}>Sample Type</Text>
            <Text style={styles.tableHeaderText}>Container</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
            <Text style={styles.tableHeaderText}>Action</Text>
          </View>

          {filteredWorklist.map((item, index) => (
            <View
              key={`worklist-${item.bill_item_id}-${index}`}
              style={styles.tableRow}
            >
              <View style={styles.patientCell}>
                <Text style={styles.patientName}>{item.patient_name}</Text>
                <Text style={styles.testNumber}>Reg: {item.reg_no}</Text>
              </View>
              <Text style={styles.cellText}>{item.reg_no}</Text>
              <Text style={styles.cellText}>{item.test_name}</Text>
              <Text style={styles.cellText}>{item.sample_type}</Text>
              <Text style={styles.cellText}>{item.tube_color || "N/A"}</Text>
              <View style={styles.statusCell}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "Pending" && styles.pendingBadge,
                    item.status === "Collected" && styles.acknowledgedBadge,
                    item.status === "Test Done" && styles.acknowledgedBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      (item.status === "Pending" ||
                        item.status === "Collected" ||
                        item.status === "Test Done") &&
                        styles.pendingText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  item.status !== "Pending" && styles.disabledButton,
                ]}
                onPress={() => handleAcknowledge(item.bill_item_id)}
                disabled={item.status !== "Pending"}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    item.status !== "Pending" && styles.disabledActionText,
                  ]}
                >
                  {item.status === "Pending" ? "✓ Acknowledge" : item.status}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          {filteredWorklist.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No pending samples in this department
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  header: {
    backgroundColor: COLORS.navyDeep,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  hamburgerBtn: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  hamburgerText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: "600",
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
    marginRight: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navyDeep,
    marginBottom: 16,
  },
  departmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  departmentCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 2,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDepartmentCard: {
    borderColor: COLORS.royalBlue,
    backgroundColor: COLORS.iceBlue,
  },
  departmentIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navyDeep,
    textAlign: "center",
  },
  selectedDepartmentName: {
    color: COLORS.royalBlue,
  },
  countBadge: {
    backgroundColor: COLORS.warningOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  countText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
  },
  worklistHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  worklistTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.navyDeep,
    flex: 1,
  },
  refreshButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  worklistSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.navyDeep,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
  },
  patientCell: {
    flex: 1,
    alignItems: "flex-start",
  },
  patientName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.navyDeep,
  },
  testNumber: {
    fontSize: 10,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  cellText: {
    fontSize: 11,
    color: COLORS.labelGray,
    flex: 1,
    textAlign: "center",
  },
  statusCell: {
    flex: 1,
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: COLORS.warningOrange,
  },
  acknowledgedBadge: {
    backgroundColor: COLORS.successGreen,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  pendingText: {
    color: COLORS.white,
  },
  acknowledgedText: {
    color: COLORS.white,
  },
  actionButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  disabledActionText: {
    color: COLORS.mutedText,
  },
  disabledButton: {
    backgroundColor: "#E5E7EB",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: "center",
  },
});
