import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import api, { ReportItem } from "../services/api";

// Extended API response for reports
interface ReportsApiResponse {
  success: boolean;
  count?: number;
  reports?: ReportItem[];
  data?: ReportItem;
  message?: string;
}

Dimensions.get("window"); // Keep import for future use

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
};

// Report detail interface
interface ReportDetail extends ReportItem {
  machine_no?: string;
  tested_by_name?: string;
  verified_by_name?: string;
  notes?: string;
  results_count?: number;
  results?: {
    parameter_name: string;
    result_value: string;
    unit: string;
    reference_range: string;
    result_flag: string;
  }[];
}

export default function ReportDownload() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState({
    reports: false,
    download: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading((prev) => ({ ...prev, reports: true }));
    try {
      const response =
        (await api.getApprovedReports()) as unknown as ReportsApiResponse;
      if (response.success && response.reports) {
        setReports(response.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Error", "Failed to fetch reports");
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const handleSearch = async () => {
    setIsSearched(true);
    setLoading((prev) => ({ ...prev, reports: true }));

    try {
      const response = (await api.getApprovedReports(
        searchTerm,
        fromDate,
        toDate,
      )) as unknown as ReportsApiResponse;
      if (response.success && response.reports) {
        setReports(response.reports);
      }
    } catch (error) {
      console.error("Error searching reports:", error);
      Alert.alert("Error", "Failed to search reports");
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
    setIsSearched(false);
    fetchReports();
  };

  const handleViewReport = async (report: ReportItem) => {
    try {
      setLoading((prev) => ({ ...prev, download: true }));
      console.log("Fetching report details for sample:", report.sample_id);

      const response = (await api.getReportDetails(
        report.sample_id,
      )) as unknown as ReportsApiResponse;
      console.log("Report details response:", response);

      if (response.success) {
        // Backend returns flat structure, not nested in data
        const reportData = response as unknown as ReportDetail;
        setSelectedReport(reportData);
        setShowModal(true);
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to fetch report details",
        );
      }
    } catch (error: any) {
      console.error("Error fetching report details:", error);
      Alert.alert("Error", error?.message || "Failed to fetch report details");
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport) return;

    setLoading((prev) => ({ ...prev, download: true }));

    try {
      const API_BASE = "http://localhost:7005/api";
      const token = await api.getToken();

      const fileUri =
        FileSystem.cacheDirectory + `report-${selectedReport.sample_id}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_BASE}/lab/generate-report-pdf/${selectedReport.sample_id}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { uri } = await downloadResumable.downloadAsync();

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Failed to share report");
    } finally {
      setLoading((prev) => ({ ...prev, download: false }));
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlagColor = (flag: string) => {
    switch (flag?.toLowerCase()) {
      case "high":
      case "critical":
        return COLORS.dangerRed;
      case "low":
        return COLORS.warningOrange;
      default:
        return COLORS.successGreen;
    }
  };

  const formatDateDisplay = (date: string) => {
    if (!date) return "dd-mm-yyyy";
    return date;
  };

  const renderReportModal = () => (
    <Modal
      visible={showModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Lab Test Report</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedReport && (
            <>
              {/* Hospital Header */}
              <View style={styles.reportHeader}>
                <Text style={styles.hospitalName}>MERIL HIMS HOSPITAL</Text>
                <Text style={styles.hospitalAddress}>
                  123 Healthcare Avenue, Medical District{"\n"}
                  Phone: +91-1234567890 | lab@merilhims.com
                </Text>
                <Text style={styles.reportTitle}>LABORATORY TEST REPORT</Text>
              </View>

              {/* Patient Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Patient Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patient Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.patient_name}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Registration No:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.patient_reg_no}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sample ID:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.sample_id}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Test Name:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.test_name}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Machine No:</Text>
                  <Text style={styles.infoValue}>
                    {selectedReport.machine_no || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Test Results */}
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>Test Results</Text>
                <View style={styles.resultsTable}>
                  <View style={styles.resultsTableHeader}>
                    <Text style={[styles.resultsHeaderCell, { flex: 2 }]}>
                      Parameter
                    </Text>
                    <Text style={styles.resultsHeaderCell}>Result</Text>
                    <Text style={styles.resultsHeaderCell}>Unit</Text>
                    <Text style={[styles.resultsHeaderCell, { flex: 1.5 }]}>
                      Ref. Range
                    </Text>
                    <Text style={styles.resultsHeaderCell}>Flag</Text>
                  </View>
                  {selectedReport.results?.map((result, index) => (
                    <View key={index} style={styles.resultsTableRow}>
                      <Text style={[styles.resultsCell, { flex: 2 }]}>
                        {result.parameter_name}
                      </Text>
                      <Text
                        style={[
                          styles.resultsCell,
                          {
                            fontWeight: "600",
                            color: getFlagColor(result.result_flag),
                          },
                        ]}
                      >
                        {result.result_value}
                      </Text>
                      <Text style={styles.resultsCell}>{result.unit}</Text>
                      <Text style={[styles.resultsCell, { flex: 1.5 }]}>
                        {result.reference_range}
                      </Text>
                      <View style={styles.flagCell}>
                        <View
                          style={[
                            styles.flagBadge,
                            {
                              backgroundColor: getFlagColor(result.result_flag),
                            },
                          ]}
                        >
                          <Text style={styles.flagText}>
                            {result.result_flag}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {(!selectedReport.results ||
                    selectedReport.results.length === 0) && (
                      <View style={styles.resultsTableRow}>
                        <Text style={styles.emptyText}>No results available</Text>
                      </View>
                    )}
                </View>
              </View>

              {/* Notes */}
              {selectedReport.notes && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedReport.notes}</Text>
                </View>
              )}

              {/* Footer */}
              <View style={styles.reportFooter}>
                <View style={styles.footerRow}>
                  <Text style={styles.footerLabel}>Tested By:</Text>
                  <Text style={styles.footerValue}>
                    {selectedReport.tested_by_name || "N/A"} on{" "}
                    {formatDateTime(selectedReport.tested_at)}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  <Text
                    style={[styles.footerLabel, { color: COLORS.royalBlue }]}
                  >
                    Verified & Approved By:
                  </Text>
                  <Text
                    style={[styles.footerValue, { color: COLORS.successGreen }]}
                  >
                    {selectedReport.verified_by_name || "N/A"} on{" "}
                    {formatDateTime(selectedReport.verified_at)}
                  </Text>
                </View>
                <Text style={styles.footerNote}>
                  This is a computer-generated report. No manual signature
                  required.
                </Text>
              </View>

              {/* Download Button */}
              <TouchableOpacity
                style={styles.downloadPdfButton}
                onPress={handleDownloadPDF}
                disabled={loading.download}
              >
                <Text style={styles.downloadPdfButtonText}>
                  {loading.download ? "Generating PDF..." : "Download PDF"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
        <Text style={styles.headerTitle}>Lab Test Report Download</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <Text style={styles.description}>
          Download approved lab test reports
        </Text>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>
            Search (Sample ID / Patient / Test)
          </Text>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Enter search term..."
            placeholderTextColor={COLORS.mutedText}
          />

          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>From Date</Text>
              <TextInput
                style={styles.dateInput}
                value={formatDateDisplay(fromDate)}
                onChangeText={setFromDate}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={COLORS.mutedText}
              />
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>To Date</Text>
              <TextInput
                style={styles.dateInput}
                value={formatDateDisplay(toDate)}
                onChangeText={setToDate}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={COLORS.mutedText}
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>🔍 Search</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>↺ Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading.reports ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <View style={styles.tableSection}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Sample ID</Text>
              <Text style={styles.tableHeaderText}>Patient Name</Text>
              <Text style={styles.tableHeaderText}>Test Name</Text>
              <Text style={styles.tableHeaderText}>Tested Date</Text>
              <Text style={styles.tableHeaderText}>Approved Date</Text>
              <Text style={styles.tableHeaderText}>Action</Text>
            </View>

            {reports.length > 0 ? (
              reports.map((report) => (
                <View key={report.id} style={styles.tableRow}>
                  <Text style={styles.tableCellText}>{report.sample_id}</Text>
                  <Text style={styles.tableCellText}>
                    {report.patient_name}
                  </Text>
                  <Text style={styles.tableCellText}>{report.test_name}</Text>
                  <Text style={styles.tableCellText}>
                    {report.tested_at
                      ? new Date(report.tested_at).toLocaleDateString()
                      : "N/A"}
                  </Text>
                  <Text style={styles.tableCellText}>
                    {report.verified_at
                      ? new Date(report.verified_at).toLocaleDateString()
                      : "N/A"}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewReport(report)}
                    disabled={loading.download}
                  >
                    <Text style={styles.viewButtonText}>
                      {loading.download ? "⏳" : "👁 View"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {isSearched
                    ? "No approved reports found matching your criteria"
                    : "No approved reports found"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Report Modal */}
      {renderReportModal()}
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
  description: {
    fontSize: 16,
    color: COLORS.labelGray,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  searchSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.navyDeep,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.navyDeep,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.labelGray,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.navyDeep,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: COLORS.royalBlue,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  resetButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: COLORS.labelGray,
    fontSize: 14,
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
  viewButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  viewButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "600",
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
    backgroundColor: COLORS.white,
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
  reportHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.navyDeep,
  },
  hospitalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.royalBlue,
    marginBottom: 8,
  },
  hospitalAddress: {
    fontSize: 12,
    color: COLORS.labelGray,
    textAlign: "center",
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.navyDeep,
    textTransform: "uppercase",
  },
  infoSection: {
    backgroundColor: COLORS.iceBlue,
    padding: 16,
    borderRadius: 8,
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
  resultsSection: {
    marginBottom: 20,
  },
  resultsTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  resultsTableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.navyDeep,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  resultsHeaderCell: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  resultsTableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
  },
  resultsCell: {
    fontSize: 11,
    color: COLORS.labelGray,
    flex: 1,
    textAlign: "center",
  },
  flagCell: {
    flex: 1,
    alignItems: "center",
  },
  flagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  flagText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.navyDeep,
    fontStyle: "italic",
  },
  reportFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.labelGray,
    marginRight: 8,
  },
  footerValue: {
    fontSize: 14,
    color: COLORS.navyDeep,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.mutedText,
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  downloadPdfButton: {
    backgroundColor: COLORS.successGreen,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  downloadPdfButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: "center",
  },
});
