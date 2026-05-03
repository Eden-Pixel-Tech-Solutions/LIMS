import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api, { LabCategory, SampleContainer, SampleType, LabTest } from '../services/api';

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

export default function LabSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tests');
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  
  // API state
  const [categories, setCategories] = useState<LabCategory[]>([]);
  const [containers, setContainers] = useState<SampleContainer[]>([]);
  const [sampleTypes, setSampleTypes] = useState<SampleType[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState({
    categories: false,
    containers: false,
    sampleTypes: false,
    tests: false,
  });
  
  // New test form state
  const [newTest, setNewTest] = useState({
    code: '',
    name: '',
    category: '',
    lab: '',
    sampleType: '',
    container: '',
    price: '',
    storageConditions: '',
    methodology: '',
    parameters: [] as string[],
  });

  const tabs = [
    { id: 'tests', label: 'Lab Tests', icon: '🧪' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'containers', label: 'Sample Containers', icon: '🧫' },
    { id: 'types', label: 'Sample Types', icon: '💉' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading((prevLoading: any) => ({ ...prevLoading, categories: true }));
      try {
        const response = await api.getLabCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading((prevLoading: any) => ({ ...prevLoading, categories: false }));
      }
    };

    const fetchContainers = async () => {
      setLoading((prevLoading: any) => ({ ...prevLoading, containers: true }));
      try {
        const response = await api.getSampleContainers();
        if (response.success && response.data) {
          setContainers(response.data);
        }
      } catch (error) {
        console.error('Error fetching containers:', error);
      } finally {
        setLoading((prevLoading: any) => ({ ...prevLoading, containers: false }));
      }
    };

    const fetchSampleTypes = async () => {
      setLoading((prevLoading: any) => ({ ...prevLoading, sampleTypes: true }));
      try {
        const response = await api.getSampleTypes();
        if (response.success && response.data) {
          setSampleTypes(response.data);
        }
      } catch (error) {
        console.error('Error fetching sample types:', error);
      } finally {
        setLoading((prevLoading: any) => ({ ...prevLoading, sampleTypes: false }));
      }
    };

    const fetchTests = async () => {
      setLoading((prevLoading: any) => ({ ...prevLoading, tests: true }));
      try {
        const response = await api.getLabTests();
        if (response.success && response.data) {
          setTests(response.data);
        }
      } catch (error) {
        console.error('Error fetching tests:', error);
      } finally {
        setLoading((prevLoading: any) => ({ ...prevLoading, tests: false }));
      }
    };

    fetchCategories();
    fetchContainers();
    fetchSampleTypes();
    fetchTests();
  }, []);

  const handleAddTest = () => {
    if (!newTest.code || !newTest.name || !newTest.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // Here you would save the test to your backend
    Alert.alert('Success', 'Test added successfully!');
    setShowAddTestModal(false);
    setNewTest({
      code: '',
      name: '',
      category: '',
      lab: '',
      sampleType: '',
      container: '',
      price: '',
      storageConditions: '',
      methodology: '',
      parameters: [],
    });
  };

  const renderTestsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.tabTitle}>Lab Tests</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddTestModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Test</Text>
        </TouchableOpacity>
      </View>

      {loading.tests ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {tests.map((test: LabTest) => (
            <View key={test.id} style={styles.listItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemCode}>{test.test_code}</Text>
                <Text style={styles.itemPrice}>${test.price?.toFixed(2) || '0.00'}</Text>
              </View>
              <Text style={styles.itemName}>{test.test_name}</Text>
              <Text style={styles.itemCategory}>{test.category_name || 'Uncategorized'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCategoriesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.tabTitle}>Categories</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Category</Text>
        </TouchableOpacity>
      </View>

      {loading.categories ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {categories.map((category: LabCategory) => (
            <View key={category.id} style={styles.gridItem}>
              <Text style={styles.gridItemText}>{category.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderContainersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.tabTitle}>Sample Containers</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Container</Text>
        </TouchableOpacity>
      </View>

      {loading.containers ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading containers...</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {containers.map((container: SampleContainer) => (
            <View key={container.id} style={styles.gridItem}>
              <Text style={styles.gridItemText}>{container.container_name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderTypesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.tabTitle}>Sample Types</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Type</Text>
        </TouchableOpacity>
      </View>

      {loading.sampleTypes ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sample types...</Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {sampleTypes.map((type: SampleType) => (
            <View key={type.id} style={styles.gridItem}>
              <Text style={styles.gridItemText}>{type.type_name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderAddTestModal = () => (
    <Modal
      visible={showAddTestModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddTestModal(false)}>
            <Text style={styles.cancelButton}>×</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Lab Test</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Test Code *</Text>
            <TextInput
              style={styles.input}
              value={newTest.code}
              onChangeText={(text) => setNewTest({...newTest, code: text})}
              placeholder="e.g., CBC"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Test Name *</Text>
            <TextInput
              style={styles.input}
              value={newTest.name}
              onChangeText={(text) => setNewTest({...newTest, name: text})}
              placeholder="e.g., Complete Blood Count"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.selectContainer}>
              <TextInput
                style={styles.input}
                value={newTest.category}
                onChangeText={(text) => setNewTest({...newTest, category: text})}
                placeholder="Select Category"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Lab</Text>
            <View style={styles.selectContainer}>
              <TextInput
                style={styles.input}
                value={newTest.lab}
                onChangeText={(text) => setNewTest({...newTest, lab: text})}
                placeholder="Select Lab"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sample Type</Text>
            <View style={styles.selectContainer}>
              <TextInput
                style={styles.input}
                value={newTest.sampleType}
                onChangeText={(text) => setNewTest({...newTest, sampleType: text})}
                placeholder="Select Sample Type"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Sample Container</Text>
            <View style={styles.selectContainer}>
              <TextInput
                style={styles.input}
                value={newTest.container}
                onChangeText={(text) => setNewTest({...newTest, container: text})}
                placeholder="Select Container"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={newTest.price}
              onChangeText={(text) => setNewTest({...newTest, price: text})}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Storage Conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newTest.storageConditions}
              onChangeText={(text) => setNewTest({...newTest, storageConditions: text})}
              placeholder="e.g., Refrigerated at 2-8°C"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Methodology</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newTest.methodology}
              onChangeText={(text) => setNewTest({...newTest, methodology: text})}
              placeholder="e.g., Automated chemistry analyzer"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Test Parameters</Text>
            <TouchableOpacity style={styles.aiButton}>
              <Text style={styles.aiButtonText}>🤖 AI Generate Parameters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addParameterButton}>
              <Text style={styles.addParameterText}>+ Add Parameter</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleAddTest}>
            <Text style={styles.saveButtonText}>Save Test</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Lab Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'tests' && renderTestsTab()}
        {activeTab === 'categories' && renderCategoriesTab()}
        {activeTab === 'containers' && renderContainersTab()}
        {activeTab === 'types' && renderTypesTab()}
      </ScrollView>

      {/* Add Test Modal */}
      {renderAddTestModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: COLORS.iceBlue,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: COLORS.royalBlue,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navyDeep,
  },
  addButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.royalBlue,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navyDeep,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.successGreen,
  },
  itemName: {
    fontSize: 14,
    color: COLORS.labelGray,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    width: (width - 60) / 2,
    alignItems: 'center',
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navyDeep,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelButton: {
    fontSize: 24,
    color: COLORS.mutedText,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.navyDeep,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.labelGray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.inputBg,
    color: COLORS.navyDeep,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    position: 'relative',
  },
  aiButton: {
    backgroundColor: COLORS.accentBlue,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  aiButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  addParameterButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addParameterText: {
    color: COLORS.royalBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.royalBlue,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.mutedText,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
