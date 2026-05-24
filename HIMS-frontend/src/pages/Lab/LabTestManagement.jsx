import React, { useState, useEffect } from 'react';
import '../../assets/CSS/LabTestManagement.css';

const LabTestManagement = () => {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [containers, setContainers] = useState([]);
  const [sampleTypes, setSampleTypes] = useState([]);
  const [labs, setLabs] = useState([]);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddContainerModal, setShowAddContainerModal] = useState(false);
  const [showAddSampleTypeModal, setShowAddSampleTypeModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    test_code: '',
    test_name: '',
    category_id: '',
    lab_id: '',
    sample_type: '',
    tube_color: '',
    storage_conditions: '',
    methodology: '',
    price: '',
    parameters: []
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [containerFormData, setContainerFormData] = useState({
    container_name: '',
    tube_color: '',
    volume_ml: '',
    additives: '',
    storage_temperature: '',
    special_instructions: ''
  });
  const [sampleTypeFormData, setSampleTypeFormData] = useState({
    type_name: '',
    description: ''
  });

  const CLINIQUANT_TESTS = [
    { id: 1, name: "ALP", unit: "U/L" },
    { id: 2, name: "ALT", unit: "U/L" },
    { id: 3, name: "AMY", unit: "U/L" },
    { id: 4, name: "AST", unit: "U/L" },
    { id: 5, name: "CHO", unit: "mg/dL" },
    { id: 6, name: "CKMB", unit: "U/L" },
    { id: 7, name: "CKNAC", unit: "U/L" },
    { id: 8, name: "GGT", unit: "U/L" },
    { id: 9, name: "GLU", unit: "mg/dL" },
    { id: 10, name: "LDH", unit: "U/L" },
    { id: 11, name: "TRIG", unit: "mg/dL" },
    { id: 12, name: "UREA", unit: "mg/dL" },
    { id: 13, name: "URIC-ACID", unit: "mg/dL" },
    { id: 14, name: "ALB", unit: "g/dL" },
    { id: 15, name: "TBIL", unit: "mg/dL" },
    { id: 16, name: "CAL-A", unit: "mg/dL" },
    { id: 17, name: "CAL-O", unit: "mg/dL" },
    { id: 18, name: "CHL", unit: "mmol/L" },
    { id: 19, name: "CREAT", unit: "mg/dL" },
    { id: 20, name: "DBIL", unit: "mg/dL" },
    { id: 21, name: "HDL", unit: "mg/dL" },
    { id: 22, name: "PHO", unit: "mg/dL" },
    { id: 23, name: "TP", unit: "g/dL" },
    { id: 24, name: "MICRO PROTEIN", unit: "mg/dL" },
    { id: 25, name: "HBA1C", unit: "%" },
    { id: 26, name: "ASO LATEX", unit: "" },
    { id: 27, name: "CRP LATEX", unit: "" },
    { id: 28, name: "RF LATEX", unit: "" },
    { id: 29, name: "D DIMER", unit: "" }
  ];

  const CELQUANT_TESTS = [
    { id: "6690-2", name: "WBC", unit: "10^3/µL" },
    { id: "789-8", name: "RBC", unit: "10^6/µL" },
    { id: "718-7", name: "HGB", unit: "g/dL" },
    { id: "4544-3", name: "HCT", unit: "%" },
    { id: "785-6", name: "MCH", unit: "pg" },
    { id: "786-4", name: "MCHC", unit: "g/dL" },
    { id: "788-0", name: "RDW-CV", unit: "%" },
    { id: "70-5", name: "RDW-SD", unit: "fL" },
    { id: "777-3", name: "PLT", unit: "10^3/µL" },
    { id: "32623-1", name: "MPV", unit: "fL" },
    { id: "32207-3", name: "PDW", unit: "fL" },
    { id: "10002", name: "PCT", unit: "%" },
    { id: "731-0", name: "Lymph#", unit: "10^3/µL" },
    { id: "736-9", name: "Lymph%", unit: "%" },
    { id: "10027", name: "Mid#", unit: "10^3/µL" },
    { id: "10029", name: "Mid%", unit: "%" },
    { id: "10028", name: "Gran#", unit: "10^3/µL" },
    { id: "10030", name: "Gran%", unit: "%" }
  ];

  const [selectedAnalyzer, setSelectedAnalyzer] = useState(''); // 'CliniQuant Micro' or ''

  useEffect(() => {
    fetchCategories();
    fetchContainers();
    fetchSampleTypes();
    fetchLabs();
    if (activeTab === 'tests') {
      fetchTests();
    }
  }, [activeTab]);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/lab/tests');
      const data = await response.json();
      if (data.success) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/lab/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/lab/containers');
      const data = await response.json();
      if (data.success) {
        setContainers(data.containers);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
    }
  };

  const fetchSampleTypes = async () => {
    try {
      const response = await fetch('/api/lab/sample-types');
      const data = await response.json();
      if (data.success) {
        setSampleTypes(data.sampleTypes);
      }
    } catch (error) {
      console.error('Error fetching sample types:', error);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/lab/labs');
      const data = await response.json();
      if (data.success) {
        setLabs(data.labs);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      test_code: '',
      test_name: '',
      category_id: '',
      sample_type: '',
      tube_color: '',
      storage_conditions: '',
      methodology: '',
      price: '',
      parameters: []
    });
    setEditingTest(null);
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    try {
      if (!formData.lab_id || !selectedAnalyzer) {
        alert('Please select both a Lab and an Analyzer.');
        return;
      }

      const response = await fetch('/api/lab/map-analyzer-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          lab_id: formData.lab_id, 
          analyzer_name: selectedAnalyzer 
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Success: ${data.message}`);
        setShowAddTestModal(false);
        resetForm();
        fetchTests();
      } else {
        alert(data.message || 'Error mapping analyzer tests');
      }
    } catch (error) {
      console.error('Error mapping analyzer tests:', error);
      alert('Error mapping analyzer tests');
    }
  };

  const handleEditTest = async (testId) => {
    try {
      const response = await fetch(`/api/lab/tests/${testId}`);
      const data = await response.json();
      if (data.success) {
        setFormData({
          test_code: data.test.test_code,
          test_name: data.test.test_name,
          category_id: data.test.category_id,
          sample_type: data.test.sample_type,
          tube_color: data.test.tube_color || '',
          storage_conditions: data.test.storage_conditions || '',
          methodology: data.test.methodology || '',
          price: data.test.price || '',
          parameters: data.parameters
        });
        setEditingTest(data.test);
        setSelectedAnalyzer(data.test.analyzer_name || '');
        setShowAddTestModal(true);
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      const response = await fetch(`/api/lab/tests/${testId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchTests();
      } else {
        alert(data.message || 'Error deleting test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Error deleting test');
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/lab/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryFormData)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddCategoryModal(false);
        setCategoryFormData({ name: '', description: '' });
        fetchCategories();
      } else {
        alert(data.message || 'Error adding category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Error adding category');
    }
  };

  const handleSubmitContainer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/lab/containers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(containerFormData)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddContainerModal(false);
        setContainerFormData({
          container_name: '',
          tube_color: '',
          volume_ml: '',
          additives: '',
          storage_temperature: '',
          special_instructions: ''
        });
        fetchContainers();
      } else {
        alert(data.message || 'Error adding container');
      }
    } catch (error) {
      console.error('Error adding container:', error);
      alert('Error adding container');
    }
  };

  const handleSubmitSampleType = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/lab/sample-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sampleTypeFormData)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddSampleTypeModal(false);
        setSampleTypeFormData({ type_name: '', description: '' });
        fetchSampleTypes();
      } else {
        alert(data.message || 'Error adding sample type');
      }
    } catch (error) {
      console.error('Error adding sample type:', error);
      alert('Error adding sample type');
    }
  };

  return (
    <div className="lab-test-management">
      <div className="header">
        <h1>Laboratory Test Management</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'tests' ? 'active' : ''}
            onClick={() => setActiveTab('tests')}
          >
            Lab Tests
          </button>
          <button 
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button 
            className={activeTab === 'containers' ? 'active' : ''}
            onClick={() => setActiveTab('containers')}
          >
            Sample Containers
          </button>
          <button 
            className={activeTab === 'sample-types' ? 'active' : ''}
            onClick={() => setActiveTab('sample-types')}
          >
            Sample Types
          </button>
        </div>
      </div>

      {activeTab === 'tests' && (
        <div className="tests-section">
          <div className="section-header">
            <h2>Lab Tests</h2>
            <button 
              className="btn-primary"
              onClick={() => {
                resetForm();
                setShowAddTestModal(true);
              }}
            >
              Map Analyzer Tests
            </button>
          </div>
          
          <div className="tests-grid">
            {tests.map(test => (
              <div key={test.id} className="test-card">
                <div className="test-header">
                  <h3>{test.test_name}</h3>
                  <span className="test-code">{test.test_code}</span>
                </div>
                <div className="test-details">
                  <p><strong>Category:</strong> {test.category_name}</p>
                  {test.lab_name && <p><strong>Lab:</strong> {test.lab_name}</p>}
                  <p><strong>Sample Type:</strong> {test.sample_type}</p>
                  <p><strong>Tube Color:</strong> {test.tube_color || 'N/A'}</p>
                  {test.price && <p><strong>Price:</strong> ₹{test.price}</p>}
                </div>
                <div className="test-actions">
                  <button onClick={() => handleEditTest(test.id)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTest(test.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="categories-section">
          <div className="section-header">
            <h2>Lab Test Categories</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowAddCategoryModal(true)}
            >
              Add Category
            </button>
          </div>
          
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <h3>{category.name}</h3>
                {category.description && <p>{category.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'containers' && (
        <div className="containers-section">
          <div className="section-header">
            <h2>Sample Containers</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowAddContainerModal(true)}
            >
              Add Container
            </button>
          </div>
          
          <div className="containers-grid">
            {containers.map(container => (
              <div key={container.id} className="container-card">
                <h3>{container.container_name}</h3>
                <div className="container-details">
                  <p><strong>Tube Color:</strong> {container.tube_color || 'N/A'}</p>
                  <p><strong>Volume:</strong> {container.volume_ml || 'N/A'} ml</p>
                  <p><strong>Additives:</strong> {container.additives || 'N/A'}</p>
                  <p><strong>Storage:</strong> {container.storage_temperature || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sample-types' && (
        <div className="sample-types-section">
          <div className="section-header">
            <h2>Sample Types</h2>
            <button 
              className="btn-primary"
              onClick={() => setShowAddSampleTypeModal(true)}
            >
              Add Sample Type
            </button>
          </div>
          
          <div className="categories-grid">
            {sampleTypes.map(type => (
              <div key={type.id} className="category-card">
                <h3>{type.type_name}</h3>
                {type.description && <p>{type.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Test Modal */}
      {showAddTestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTest ? 'Edit Lab Test' : 'Map Analyzer Tests to Lab'}</h2>
              <button onClick={() => {
                setShowAddTestModal(false);
                resetForm();
              }} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleSubmitTest} className="test-form">
              <div className="modal-form-content">
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Select Lab *</label>
                <select
                  value={formData.lab_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, lab_id: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Select Lab --</option>
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} {lab.block ? `(${lab.block})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontWeight: '600', color: '#1e293b', marginBottom: '8px', display: 'block' }}>
                  Select Analyzer / Machine *
                </label>
                <select 
                  value={selectedAnalyzer}
                  onChange={(e) => setSelectedAnalyzer(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Select Analyzer --</option>
                  <option value="CliniQuant Micro">Merilyzer CliniQuant Micro</option>
                  <option value="CelQuant Edge">Merilyzer CelQuant Edge (3-Part)</option>
                  <option value="HDC-Lyte Plus">HDC Lyte Pro (Electrolytes)</option>
                  <option value="LAURA Smart">Erba Mannheim LAURA Smart (Urine)</option>
                  <option value="ALTA Hematology">Athenese Dx ALTA Hematology (CBC)</option>
                </select>
                
                {selectedAnalyzer && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
                    <strong>Note:</strong> All standard tests associated with this analyzer will be automatically generated and mapped to the selected lab.
                  </p>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => {
                setShowAddTestModal(false);
                resetForm();
              }} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Map Tests
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Lab Category</h2>
              <button onClick={() => {
                setShowAddCategoryModal(false);
                setCategoryFormData({ name: '', description: '' });
              }} className="close-btn">&times;</button>
            </div>
            
            <form onSubmit={handleSubmitCategory} className="category-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowAddCategoryModal(false);
                  setCategoryFormData({ name: '', description: '' });
                }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Container Modal */}
      {showAddContainerModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Sample Container</h2>
              <button onClick={() => {
                setShowAddContainerModal(false);
                setContainerFormData({
                  container_name: '',
                  tube_color: '',
                  volume_ml: '',
                  additives: '',
                  storage_temperature: '',
                  special_instructions: ''
                });
              }} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmitContainer} className="container-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Container Name *</label>
                  <input
                    type="text"
                    value={containerFormData.container_name}
                    onChange={(e) => setContainerFormData(prev => ({ ...prev, container_name: e.target.value }))}
                    placeholder="e.g., EDTA Tube, Serum Tube"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tube Color</label>
                  <input
                    type="text"
                    value={containerFormData.tube_color}
                    onChange={(e) => setContainerFormData(prev => ({ ...prev, tube_color: e.target.value }))}
                    placeholder="e.g., Lavender, Red, Blue"
                  />
                </div>

                <div className="form-group">
                  <label>Volume (ml)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={containerFormData.volume_ml}
                    onChange={(e) => setContainerFormData(prev => ({ ...prev, volume_ml: e.target.value }))}
                    placeholder="e.g., 5.0"
                  />
                </div>

                <div className="form-group">
                  <label>Additives</label>
                  <input
                    type="text"
                    value={containerFormData.additives}
                    onChange={(e) => setContainerFormData(prev => ({ ...prev, additives: e.target.value }))}
                    placeholder="e.g., EDTA, Heparin, None"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Storage Temperature</label>
                <input
                  type="text"
                  value={containerFormData.storage_temperature}
                  onChange={(e) => setContainerFormData(prev => ({ ...prev, storage_temperature: e.target.value }))}
                  placeholder="e.g., Room Temperature, 2-8°C, -20°C"
                />
              </div>

              <div className="form-group">
                <label>Special Instructions</label>
                <textarea
                  value={containerFormData.special_instructions}
                  onChange={(e) => setContainerFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                  placeholder="e.g., Mix gently by inverting 8-10 times, Protect from light"
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowAddContainerModal(false);
                  setContainerFormData({
                    container_name: '',
                    tube_color: '',
                    volume_ml: '',
                    additives: '',
                    storage_temperature: '',
                    special_instructions: ''
                  });
                }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Container
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sample Type Modal */}
      {showAddSampleTypeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Sample Type</h2>
              <button onClick={() => {
                setShowAddSampleTypeModal(false);
                setSampleTypeFormData({ type_name: '', description: '' });
              }} className="close-btn">&times;</button>
            </div>

            <form onSubmit={handleSubmitSampleType} className="category-form">
              <div className="form-group">
                <label>Type Name *</label>
                <input
                  type="text"
                  value={sampleTypeFormData.type_name}
                  onChange={(e) => setSampleTypeFormData(prev => ({ ...prev, type_name: e.target.value }))}
                  placeholder="e.g., Blood, Urine, Tissue"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={sampleTypeFormData.description}
                  onChange={(e) => setSampleTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Whole blood samples for hematology tests"
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowAddSampleTypeModal(false);
                  setSampleTypeFormData({ type_name: '', description: '' });
                }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Sample Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTestManagement;
