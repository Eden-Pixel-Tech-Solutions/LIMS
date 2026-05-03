import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../services/api";

// Type definitions matching backend API
interface TestResultItem {
  parameter_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  result_flag: string;
}

interface TestData {
  id: number;
  sample_id: string;
  patient_name: string;
  test_name: string;
  machine_no?: string;
  tested_at?: string;
  status: string;
  results?: TestResultItem[];
  reg_no?: string;
  tested_by_name?: string;
}

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

// User ID for verification - in production, get from auth context
const VERIFIED_BY_ID = 1;

export default function Verification() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [verificationData, setVerificationData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Fetch pending verifications on mount and when status changes
  useEffect(() => {
    fetchPendingVerifications();
  }, [selectedStatus]);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const apiStatus =
        selectedStatus === "all"
          ? undefined
          : selectedStatus === "pending"
            ? "Test Done"
            : selectedStatus === "verified"
              ? "Verified"
              : "Approved";
      const response = await api.getPendingVerifications(apiStatus);
      if (response.success) {
        setVerificationData(response.tests || []); // ✅ FIX
      }
    } catch (error) {
      console.error("Error fetching verifications:", error);
      Alert.alert("Error", "Failed to fetch pending verifications");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingVerifications().finally(() => setRefreshing(false));
  };

  const statusFilters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "verified", label: "Verified" },
    { id: "approved", label: "Approved" },
  ];

  const handleRefresh = () => {
    fetchPendingVerifications();
    Alert.alert("Refresh", "Data refreshed successfully");
  };

  const handleVerify = (test: TestData) => {
    setSelectedTest(test);
    setShowVerifyModal(true);
    setVerificationNotes("");
  };

  const handleVerifySubmit = async () => {
    if (!selectedTest) return;

    try {
      const response = await api.verifyTest({
        test_result_id: selectedTest.id,
        sample_id: selectedTest.sample_id,
        verified_by: VERIFIED_BY_ID,
        status: "Verified",
        notes: verificationNotes,
      });

      if (response.success) {
        setShowVerifyModal(false);
        setShowSuccessModal(true);
        fetchPendingVerifications(); // Refresh list
      } else {
        Alert.alert("Error", response.message || "Failed to verify test");
      }
    } catch (error) {
      console.error("Error verifying test:", error);
      Alert.alert("Error", "Failed to verify test");
    }
  };

  const handleApprove = async (test: TestData) => {
    try {
      const response = await api.verifyTest({
        test_result_id: test.id,
        sample_id: test.sample_id,
        verified_by: VERIFIED_BY_ID,
        status: "Approved",
        notes: "",
      });

      if (response.success) {
        Alert.alert("Success", "Test approved successfully!");
        fetchPendingVerifications(); // Refresh list
      } else {
        Alert.alert("Error", response.message || "Failed to approve test");
      }
    } catch (error) {
      console.error("Error approving test:", error);
      Alert.alert("Error", "Failed to approve test");
    }
  };

  // Filter based on backend status (already filtered by API, just use data as-is)
  const filteredData = verificationData as TestData[];

  const getFlagColor = (flag: string) => {
    switch (flag?.toLowerCase()) {
      case "high":
        return COLORS.dangerRed;
      case "low":
        return COLORS.warningOrange;
      case "critical":
        return COLORS.dangerRed;
      default:
        return COLORS.successGreen;
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (test: TestData) => {
    if (test.status === "Approved") return COLORS.successGreen;
    if (test.status === "Verified") return COLORS.skyBlue;
    return COLORS.pendingYellow;
  };

  const renderVerifyModal = () => (
    <Modal
      visible={showVerifyModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowVerifyModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Verify Test Results</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sample ID:</Text>
              <Text style={styles.infoValue}>{selectedTest?.sample_id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient:</Text>
              <Text style={styles.infoValue}>{selectedTest?.patient_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Test:</Text>
              <Text style={styles.infoValue}>{selectedTest?.test_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Machine:</Text>
              <Text style={styles.infoValue}>
                {selectedTest?.machine_no || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tested At:</Text>
              <Text style={styles.infoValue}>
                {formatDateTime(selectedTest?.tested_at || "")}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Test Results</Text>
          <View style={styles.resultsTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Parameter</Text>
              <Text style={styles.tableHeaderText}>Result</Text>
              <Text style={styles.tableHeaderText}>Unit</Text>
              <Text style={styles.tableHeaderText}>Reference Range</Text>
              <Text style={styles.tableHeaderText}>Flag</Text>
            </View>
            {(selectedTest?.results || []).map((result, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCellText}>
                  {result.parameter_name}
                </Text>
                <Text
                  style={[
                    styles.tableCellText,
                    { fontWeight: "600", color: COLORS.navyDeep },
                  ]}
                >
                  {result.result_value}
                </Text>
                <Text style={styles.tableCellText}>{result.unit}</Text>
                <Text style={styles.tableCellText}>
                  {result.reference_range}
                </Text>
                <Text
                  style={[
                    styles.tableCellText,
                    { color: getFlagColor(result.result_flag) },
                  ]}
                >
                  {result.result_flag}
                </Text>
              </View>
            ))}
            {(selectedTest?.results || []).length === 0 && (
              <View style={[styles.tableRow, { justifyContent: "center" }]}>
                <Text style={styles.emptyText}>No results available</Text>
              </View>
            )}
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>
              Verification Notes (Optional):
            </Text>
            <TextInput
              style={styles.notesInput}
              value={verificationNotes}
              onChangeText={setVerificationNotes}
              placeholder="Add any notes about this verification..."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifySubmit}
          >
            <Text style={styles.verifyButtonText}>✓ Mark as Verified</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal visible={showSuccessModal} transparent={true} animationType="fade">
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Test verified successfully!</Text>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.successButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Lab Head Doctor - Test Verification
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Status:</Text>
          <View style={styles.filterButtons}>
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedStatus === filter.id && styles.activeFilterButton,
                ]}
                onPress={() => setSelectedStatus(filter.id)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedStatus === filter.id &&
                      styles.activeFilterButtonText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Verification Table */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Sample ID</Text>
            <Text style={styles.tableHeaderText}>Patient Name</Text>
            <Text style={styles.tableHeaderText}>Test Name</Text>
            <Text style={styles.tableHeaderText}>Machine No</Text>
            <Text style={styles.tableHeaderText}>Tested At</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
            <Text style={styles.tableHeaderText}>Action</Text>
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.royalBlue} />
              <Text style={[styles.emptyText, { marginTop: 12 }]}>
                Loading tests...
              </Text>
            </View>
          ) : (
            <>
              {filteredData.map((item, index) => (
                <View key={`test-${item.id}-${index}`} style={styles.tableRow}>
                  <Text style={styles.tableCellText}>{item.sample_id}</Text>
                  <Text style={styles.tableCellText}>{item.patient_name}</Text>
                  <Text style={styles.tableCellText}>{item.test_name}</Text>
                  <Text style={styles.tableCellText}>
                    {item.machine_no || "N/A"}
                  </Text>
                  <Text style={styles.tableCellText}>
                    {formatDateTime(item.tested_at || "")}
                  </Text>
                  <View style={styles.statusCell}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item) },
                      ]}
                    >
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionCell}>
                    {item.status === "Test Done" && (
                      <TouchableOpacity
                        style={styles.verifyActionButton}
                        onPress={() => handleVerify(item)}
                      >
                        <Text style={styles.verifyActionText}>✓ Verify</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "Verified" && (
                      <TouchableOpacity
                        style={styles.approveActionButton}
                        onPress={() => handleApprove(item)}
                      >
                        <Text style={styles.approveActionText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "Approved" && (
                      <Text style={styles.completedText}>Approved ✓</Text>
                    )}
                  </View>
                </View>
              ))}

              {filteredData.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No tests pending verification
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderVerifyModal()}
      {renderSuccessModal()}
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
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.navyDeep,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterButton: {
    backgroundColor: COLORS.royalBlue,
    borderColor: COLORS.royalBlue,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.labelGray,
  },
  activeFilterButtonText: {
    color: COLORS.white,
  },
  refreshButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  tableSection: {
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
  tableCellText: {
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
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  actionCell: {
    flex: 1,
    alignItems: "center",
  },
  verifyActionButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyActionText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  approveActionButton: {
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  approveActionText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
  },
  completedText: {
    fontSize: 10,
    color: COLORS.mutedText,
    fontWeight: "500",
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.royalBlue,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.navyDeep,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    backgroundColor: COLORS.iceBlue,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.labelGray,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.navyDeep,
    flex: 2,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.navyDeep,
    marginBottom: 12,
  },
  resultsTable: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    overflow: "hidden",
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.navyDeep,
    textAlignVertical: "top",
  },
  verifyButton: {
    backgroundColor: COLORS.royalBlue,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 40,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  // Success modal styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: COLORS.white,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    width: width * 0.8,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.successGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 30,
    color: COLORS.white,
    fontWeight: "bold",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.navyDeep,
    textAlign: "center",
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
