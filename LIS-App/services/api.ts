import AsyncStorage from "@react-native-async-storage/async-storage";

// Initialize AsyncStorage
const initializeAsyncStorage = async () => {
  try {
    // Test if AsyncStorage is available
    await AsyncStorage.getItem("test_key");
    console.log("AsyncStorage initialized successfully");
    return true;
  } catch (error) {
    console.error("AsyncStorage initialization failed:", error);
    return false;
  }
};

// In-memory token fallback for development
let inMemoryToken: string | null = null;

// API Configuration
const API_BASE_URL = "http://localhost:7005/api/lab"; // Update with your backend URL

// Types for API responses
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Interfaces for API data
export interface DashboardStats {
  totalTests: {
    value: number;
    today: number;
    change: number;
    positive: boolean;
  };
  todayPatients: {
    value: number;
    change: number;
    positive: boolean;
  };
  pendingReports: {
    value: number;
    change: number;
    positive: boolean;
  };
  revenue: {
    value: number;
    change: number;
    positive: boolean;
  };
}

export interface ActivityEntry {
  label: string;
  time: string;
  dotColor: string;
  bgColor: string;
}

interface LabCategory {
  id: number;
  name: string;
  description?: string;
  status: string;
}

interface SampleContainer {
  id: number;
  container_name: string;
  tube_color?: string;
  volume_ml?: number;
  additives?: string;
  storage_temperature?: string;
  special_instructions?: string;
  status: string;
}

interface SampleType {
  id: number;
  type_name: string;
  description?: string;
  status: string;
}

interface LabTest {
  id: number;
  test_code: string;
  test_name: string;
  category_id: number;
  category_name?: string;
  lab_id?: number;
  lab_name?: string;
  sample_type: string;
  tube_color?: string;
  storage_conditions?: string;
  methodology?: string;
  price: number;
  status: string;
  parameters?: TestParameter[];
}

interface TestParameter {
  id?: number;
  parameter_code?: string;
  parameter_name: string;
  parameter_unit?: string;
  result_type?: string;
  min_value?: number;
  max_value?: number;
  men_min_value?: number;
  men_max_value?: number;
  women_min_value?: number;
  women_max_value?: number;
  kids_min_value?: number;
  kids_max_value?: number;
  use_demographic_ranges?: boolean;
  display_order?: number;
  is_calculated?: boolean;
  formula?: string;
  options?: string;
}

interface WorklistItem {
  id: number;
  bill_item_id: number;
  bill_id: number;
  bill_number: string;
  patient_id: number;
  patient_name: string;
  reg_no: string;
  test_id: number;
  test_name: string;
  test_code: string;
  sample_type: string;
  tube_color?: string;
  category_name: string;
  department: string;
  status: string;
  sample_id?: string;
  lab_barcode?: string;
  lab_name?: string;
  bill_date: string;
  result_id?: number;
  result_tested_at?: string;
}

interface VerificationItem {
  id: number;
  sample_id: string;
  machine_no?: string;
  test_name: string;
  results_json?: any;
  tested_by?: string;
  tested_at?: string;
  verified_by?: string;
  verified_at?: string;
  status: string;
  notes?: string;
  patient_name: string;
  reg_no: string;
  tested_by_name?: string;
  results?: any[];
}

interface ReportItem {
  id: number;
  sample_id: string;
  test_name: string;
  tested_at?: string;
  verified_at?: string;
  verified_by?: string;
  patient_name: string;
  patient_reg_no: string;
  verified_by_name?: string;
  status: string;
  results_count?: number;
  results?: any[];
}

// Auth token management
class ApiClient {
  private static instance: ApiClient;
  private token: string | null = null;

  private constructor() { }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async setToken(token: string) {
    this.token = token;
    inMemoryToken = token; // Store in memory as fallback
    try {
      await AsyncStorage.setItem("auth_token", token);
    } catch (error) {
      console.warn("AsyncStorage not available, token stored in memory only");
    }
  }

  async getToken(): Promise<string | null> {
    if (this.token) {
      return this.token;
    }
    try {
      // Check if AsyncStorage is available
      const isInitialized = await initializeAsyncStorage();
      if (!isInitialized) {
        console.warn("AsyncStorage not available, using in-memory token");
        return inMemoryToken || this.token || null;
      }

      const storedToken = await AsyncStorage.getItem("auth_token");
      this.token = storedToken;
      return storedToken;
    } catch (error) {
      console.error("Error getting token:", error);
      return inMemoryToken || this.token || null;
    }
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem("auth_token");
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`,
        );
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Lab Categories API
  async getLabCategories(): Promise<ApiResponse<LabCategory[]>> {
    return this.request<LabCategory[]>("/categories");
  }

  async addLabCategory(
    category: Partial<LabCategory>,
  ): Promise<ApiResponse<LabCategory>> {
    return this.request<LabCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateLabCategory(
    id: number,
    category: Partial<LabCategory>,
  ): Promise<ApiResponse> {
    return this.request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteLabCategory(id: number): Promise<ApiResponse> {
    return this.request(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Sample Containers API
  async getSampleContainers(): Promise<ApiResponse<SampleContainer[]>> {
    return this.request<SampleContainer[]>("/containers");
  }

  async addSampleContainer(
    container: Partial<SampleContainer>,
  ): Promise<ApiResponse<SampleContainer>> {
    return this.request<SampleContainer>("/containers", {
      method: "POST",
      body: JSON.stringify(container),
    });
  }

  async updateSampleContainer(
    id: number,
    container: Partial<SampleContainer>,
  ): Promise<ApiResponse> {
    return this.request(`/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(container),
    });
  }

  async deleteSampleContainer(id: number): Promise<ApiResponse> {
    return this.request(`/containers/${id}`, {
      method: "DELETE",
    });
  }

  // Sample Types API
  async getSampleTypes(): Promise<ApiResponse<SampleType[]>> {
    return this.request<SampleType[]>("/sample-types");
  }

  async addSampleType(
    type: Partial<SampleType>,
  ): Promise<ApiResponse<SampleType>> {
    return this.request<SampleType>("/sample-types", {
      method: "POST",
      body: JSON.stringify(type),
    });
  }

  async updateSampleType(
    id: number,
    type: Partial<SampleType>,
  ): Promise<ApiResponse> {
    return this.request(`/sample-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(type),
    });
  }

  async deleteSampleType(id: number): Promise<ApiResponse> {
    return this.request(`/sample-types/${id}`, {
      method: "DELETE",
    });
  }

  // Lab Tests API
  async getLabTests(categoryId?: number): Promise<ApiResponse<LabTest[]>> {
    const endpoint = categoryId ? `/tests?category_id=${categoryId}` : "/tests";
    return this.request<LabTest[]>(endpoint);
  }

  async getLabTestById(
    id: number,
  ): Promise<ApiResponse<{ test: LabTest; parameters: TestParameter[] }>> {
    return this.request(`/tests/${id}`);
  }

  async addLabTest(test: Partial<LabTest>): Promise<ApiResponse<LabTest>> {
    return this.request<LabTest>("/tests", {
      method: "POST",
      body: JSON.stringify(test),
    });
  }

  async updateLabTest(
    id: number,
    test: Partial<LabTest>,
  ): Promise<ApiResponse> {
    return this.request(`/tests/${id}`, {
      method: "PUT",
      body: JSON.stringify(test),
    });
  }

  async deleteLabTest(id: number): Promise<ApiResponse> {
    return this.request(`/tests/${id}`, {
      method: "DELETE",
    });
  }

  // Worklist API - backend returns { success, worklist, count } not { success, data }
  async getWorklist(
    department?: string,
  ): Promise<{
    success: boolean;
    worklist: WorklistItem[];
    count: number;
    message?: string;
  }> {
    const endpoint = department
      ? `/worklist?department=${department}`
      : "/worklist";
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }

  async generateSampleId(date: string): Promise<any> {
    return this.request("/generate-sample-id", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
  }

  async acknowledgeTest(data: {
    bill_item_id: number;
    sample_id: string;
    status?: string;
  }): Promise<ApiResponse> {
    return this.request("/acknowledge-test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTestStatus(data: {
    bill_item_id: number;
    status: string;
  }): Promise<ApiResponse> {
    return this.request("/update-test-status", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Test Results API
  async saveTestResults(data: any): Promise<ApiResponse> {
    return this.request("/save-test-results", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getTestResultsBySampleId(sampleId: string): Promise<ApiResponse> {
    return this.request(`/test-results/${sampleId}`);
  }

  // Verification API
  async getPendingVerifications(
    status?: string,
  ): Promise<ApiResponse<VerificationItem[]>> {
    const endpoint = status
      ? `/pending-verifications?status=${status}`
      : "/pending-verifications";
    return this.request<VerificationItem[]>(endpoint);
  }

  async verifyTest(data: {
    test_result_id: number;
    sample_id: string;
    verified_by: number;
    status: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request("/verify-test", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Reports API
  async getApprovedReports(
    search?: string,
    from?: string,
    to?: string,
  ): Promise<ApiResponse<ReportItem[]>> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const endpoint = `/approved-reports?${params.toString()}`;
    return this.request<ReportItem[]>(endpoint);
  }

  async getReportDetails(sampleId: string): Promise<ApiResponse<ReportItem>> {
    return this.request(`/report-details/${sampleId}`);
  }

  async generateReportPDF(sampleId: string): Promise<Blob> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE_URL}/generate-report-pdf/${sampleId}`,
      {
        headers: {
          ...headers,
          Accept: "application/pdf",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`);
    }

    return response.blob();
  }

  // Dashboard API - uses main API base, not lab base
  async getDashboardStats(): Promise<
    ApiResponse<{ stats: DashboardStats; activity: ActivityEntry[] }>
  > {
    const headers = await this.getHeaders();
    const response = await fetch(
      "http://localhost:7005/api/dashboard/stats",
      {
        headers,
      },
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }
}

export default ApiClient.getInstance();

// Export types for use in components
export type {
  LabCategory,
  SampleContainer,
  SampleType,
  LabTest,
  TestParameter,
  WorklistItem,
  VerificationItem,
  ReportItem,
  ApiResponse,
};
