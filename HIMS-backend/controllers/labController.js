import db from '../config/db.js';
import http from 'http';
import { generateLabReportPDFStream } from '../utils/pdfGenerator.js';

// Lab Categories Management
export const getLabCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM lab_categories WHERE status = ? ORDER BY name',
      ['Active']
    );
    res.json({ success: true, categories: rows });
  } catch (error) {
    console.error('Error fetching lab categories:', error);
    res.status(500).json({ success: false, message: 'Server error fetching categories' });
  }
};

export const addLabCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO lab_categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    res.status(201).json({
      success: true,
      message: 'Lab category added successfully',
      data: { id: result.insertId, name, description }
    });
  } catch (error) {
    console.error('Error adding lab category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Category name already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error adding category' });
    }
  }
};

export const updateLabCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const [result] = await db.query(
      'UPDATE lab_categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Lab category not found' });
    }

    res.json({ success: true, message: 'Lab category updated successfully' });
  } catch (error) {
    console.error('Error updating lab category:', error);
    res.status(500).json({ success: false, message: 'Server error updating lab category' });
  }
};

export const deleteLabCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE lab_categories SET status = ? WHERE id = ?',
      ['Inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Lab category not found' });
    }

    res.json({ success: true, message: 'Lab category deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab category:', error);
    res.status(500).json({ success: false, message: 'Server error deleting lab category' });
  }
};

// Sample Containers Management
export const getSampleContainers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sample_containers WHERE status = ? ORDER BY container_name',
      ['Active']
    );
    res.json({ success: true, containers: rows });
  } catch (error) {
    console.error('Error fetching sample containers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching containers' });
  }
};

export const addSampleContainer = async (req, res) => {
  try {
    const { container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions } = req.body;

    if (!container_name) {
      return res.status(400).json({ success: false, message: 'Container name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO sample_containers (container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions) VALUES (?, ?, ?, ?, ?, ?)',
      [container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions]
    );

    res.status(201).json({
      success: true,
      message: 'Sample container added successfully',
      data: { id: result.insertId, container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions }
    });
  } catch (error) {
    console.error('Error adding sample container:', error);
    res.status(500).json({ success: false, message: 'Server error adding sample container' });
  }
};

export const updateSampleContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const { container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions } = req.body;

    if (!container_name) {
      return res.status(400).json({ success: false, message: 'Container name is required' });
    }

    const [result] = await db.query(
      'UPDATE sample_containers SET container_name = ?, tube_color = ?, volume_ml = ?, additives = ?, storage_temperature = ?, special_instructions = ? WHERE id = ?',
      [container_name, tube_color, volume_ml, additives, storage_temperature, special_instructions, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sample container not found' });
    }

    res.json({ success: true, message: 'Sample container updated successfully' });
  } catch (error) {
    console.error('Error updating sample container:', error);
    res.status(500).json({ success: false, message: 'Server error updating sample container' });
  }
};

export const deleteSampleContainer = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE sample_containers SET status = ? WHERE id = ?',
      ['Inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sample container not found' });
    }

    res.json({ success: true, message: 'Sample container deleted successfully' });
  } catch (error) {
    console.error('Error deleting sample container:', error);
    res.status(500).json({ success: false, message: 'Server error deleting sample container' });
  }
};

// Sample Types Management
export const getSampleTypes = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM sample_types WHERE status = ? ORDER BY type_name',
      ['Active']
    );
    res.json({ success: true, sampleTypes: rows });
  } catch (error) {
    console.error('Error fetching sample types:', error);
    res.status(500).json({ success: false, message: 'Server error fetching sample types' });
  }
};

export const addSampleType = async (req, res) => {
  try {
    const { type_name, description } = req.body;

    if (!type_name) {
      return res.status(400).json({ success: false, message: 'Sample type name is required' });
    }

    const [result] = await db.query(
      'INSERT INTO sample_types (type_name, description) VALUES (?, ?)',
      [type_name, description]
    );

    res.status(201).json({
      success: true,
      message: 'Sample type added successfully',
      data: { id: result.insertId, type_name, description }
    });
  } catch (error) {
    console.error('Error adding sample type:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Sample type name already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error adding sample type' });
    }
  }
};

export const updateSampleType = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, description } = req.body;

    if (!type_name) {
      return res.status(400).json({ success: false, message: 'Sample type name is required' });
    }

    const [result] = await db.query(
      'UPDATE sample_types SET type_name = ?, description = ? WHERE id = ?',
      [type_name, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sample type not found' });
    }

    res.json({ success: true, message: 'Sample type updated successfully' });
  } catch (error) {
    console.error('Error updating sample type:', error);
    res.status(500).json({ success: false, message: 'Server error updating sample type' });
  }
};

export const deleteSampleType = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE sample_types SET status = ? WHERE id = ?',
      ['Inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Sample type not found' });
    }

    res.json({ success: true, message: 'Sample type deleted successfully' });
  } catch (error) {
    console.error('Error deleting sample type:', error);
    res.status(500).json({ success: false, message: 'Server error deleting sample type' });
  }
};

// Lab Tests Management
export const getLabTests = async (req, res) => {
  try {
    const { category_id } = req.query;
    let query = `
      SELECT lt.*, lc.name as category_name, i.name as lab_name
      FROM lab_tests lt
      LEFT JOIN lab_categories lc ON lt.category_id = lc.id
      LEFT JOIN infrastructure i ON lt.lab_id = i.id
      WHERE lt.status = ?
    `;
    let params = ['Active'];

    if (category_id) {
      query += ' AND lt.category_id = ?';
      params.push(category_id);
    }

    query += ' ORDER BY lt.test_name';

    const [rows] = await db.query(query, params);
    res.json({ success: true, tests: rows });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tests' });
  }
};

export const getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [testRows] = await db.query(
      `SELECT lt.*, lc.name as category_name, i.name as lab_name
       FROM lab_tests lt
       LEFT JOIN lab_categories lc ON lt.category_id = lc.id
       LEFT JOIN infrastructure i ON lt.lab_id = i.id
       WHERE lt.id = ?`,
      [id]
    );

    if (testRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    const [parameterRows] = await db.query(
      'SELECT * FROM lab_test_parameters WHERE test_id = ? AND status = ? ORDER BY display_order',
      [id, 'Active']
    );

    res.json({
      success: true,
      test: testRows[0],
      parameters: parameterRows
    });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ success: false, message: 'Server error fetching test' });
  }
};

export const addLabTest = async (req, res) => {
  try {
    const {
      test_code,
      test_name,
      category_id,
      lab_id,
      sample_type,
      tube_color,
      storage_conditions,
      methodology,
      price,
      analyzer_name,
      parameters
    } = req.body;

    if (!test_code || !test_name || !category_id || !sample_type) {
      return res.status(400).json({
        success: false,
        message: 'Test code, name, category, and sample type are required'
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if test code exists
      const [existing] = await connection.query(
        'SELECT id FROM lab_tests WHERE test_code = ?',
        [test_code]
      );

      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Test code '${test_code}' already exists.`
        });
      }

      // Insert lab test
      const [testResult] = await connection.query(
        `INSERT INTO lab_tests
         (test_code, test_name, category_id, lab_id, sample_type, tube_color, storage_conditions, methodology, price, analyzer_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [test_code, test_name, category_id, lab_id || null, sample_type, tube_color, storage_conditions, methodology, price, analyzer_name || null]
      );

      const testId = testResult.insertId;

      // Insert parameters if provided
      if (parameters && parameters.length > 0) {
        for (let i = 0; i < parameters.length; i++) {
          const param = parameters[i];
          await connection.query(
            `INSERT INTO lab_test_parameters 
             (test_id, parameter_code, parameter_name, parameter_unit, result_type, min_value, max_value,
              men_min_value, men_max_value, women_min_value, women_max_value,
              kids_min_value, kids_max_value, use_demographic_ranges, display_order, is_calculated, formula, options, machine_parameter_code) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              testId,
              param.parameter_code || null,
              param.parameter_name,
              param.parameter_unit,
              param.result_type || 'numeric',
              param.min_value || null,
              param.max_value || null,
              param.men_min_value || null,
              param.men_max_value || null,
              param.women_min_value || null,
              param.women_max_value || null,
              param.kids_min_value || null,
              param.kids_max_value || null,
              param.use_demographic_ranges ? 1 : 0,
              param.display_order || i + 1,
              param.is_calculated ? 1 : 0,
              param.formula || null,
              param.options || null,
              param.machine_parameter_code || null
            ]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Lab test added successfully',
        id: testId
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding lab test:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Test code already exists' });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ success: false, message: 'Invalid category selected' });
    } else {
      res.status(500).json({ success: false, message: 'Server error adding lab test' });
    }
  }
};

export const updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      test_code,
      test_name,
      category_id,
      lab_id,
      sample_type,
      tube_color,
      storage_conditions,
      methodology,
      price,
      analyzer_name,
      parameters
    } = req.body;

    if (!test_code || !test_name || !category_id || !sample_type) {
      return res.status(400).json({
        success: false,
        message: 'Test code, name, category, and sample type are required'
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update lab test
      const [result] = await connection.query(
        `UPDATE lab_tests
         SET test_code = ?, test_name = ?, category_id = ?, lab_id = ?, sample_type = ?, tube_color = ?,
             storage_conditions = ?, methodology = ?, price = ?, analyzer_name = ?
         WHERE id = ?`,
        [test_code, test_name, category_id, lab_id || null, sample_type, tube_color, storage_conditions, methodology, price, analyzer_name || null, id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Lab test not found' });
      }

      // Update parameters if provided
      if (parameters && parameters.length > 0) {
        // Delete existing parameters
        await connection.query('DELETE FROM lab_test_parameters WHERE test_id = ?', [id]);

        // Insert new parameters
        for (let i = 0; i < parameters.length; i++) {
          const param = parameters[i];
          await connection.query(
            `INSERT INTO lab_test_parameters 
             (test_id, parameter_code, parameter_name, parameter_unit, result_type, min_value, max_value,
              men_min_value, men_max_value, women_min_value, women_max_value,
              kids_min_value, kids_max_value, use_demographic_ranges, display_order, is_calculated, formula, options, machine_parameter_code) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              param.parameter_code || null,
              param.parameter_name,
              param.parameter_unit,
              param.result_type || 'numeric',
              param.min_value || null,
              param.max_value || null,
              param.men_min_value || null,
              param.men_max_value || null,
              param.women_min_value || null,
              param.women_max_value || null,
              param.kids_min_value || null,
              param.kids_max_value || null,
              param.use_demographic_ranges ? 1 : 0,
              param.display_order || i + 1,
              param.is_calculated ? 1 : 0,
              param.formula || null,
              param.options || null,
              param.machine_parameter_code || null
            ]
          );
        }
      }

      await connection.commit();

      res.json({ success: true, message: 'Lab test updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ success: false, message: 'Server error updating lab test' });
  }
};

export const deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE lab_tests SET status = ? WHERE id = ?',
      ['Inactive', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.json({ success: true, message: 'Lab test deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ success: false, message: 'Server error deleting lab test' });
  }
};

export const mapAnalyzerTests = async (req, res) => {
  try {
    const { lab_id, analyzer_name } = req.body;
    
    if (!lab_id || !analyzer_name) {
      return res.status(400).json({ success: false, message: 'Lab ID and Analyzer Name are required' });
    }

    const HDC_LYTE_TEMPLATE = [
      {
        test_code: 'ELYTES', test_name: 'Electrolyte Panel', department: 'Biochemistry', sample_type: 'Serum / Plasma',
        parameters: [
          { parameter_code: 'NA', parameter_name: 'Sodium', machine_parameter_code: 'Na', parameter_unit: 'mmol/L', min_value: 135, max_value: 145 },
          { parameter_code: 'K', parameter_name: 'Potassium', machine_parameter_code: 'K', parameter_unit: 'mmol/L', min_value: 3.5, max_value: 5.5 },
          { parameter_code: 'CL', parameter_name: 'Chloride', machine_parameter_code: 'Cl', parameter_unit: 'mmol/L', min_value: 98, max_value: 107 }
        ]
      },
      {
        test_code: 'SE', test_name: 'Serum Electrolytes', department: 'Biochemistry', sample_type: 'Serum',
        parameters: [
          { parameter_code: 'NA', parameter_name: 'Sodium', machine_parameter_code: 'Na', parameter_unit: 'mmol/L', min_value: 135, max_value: 145 },
          { parameter_code: 'K', parameter_name: 'Potassium', machine_parameter_code: 'K', parameter_unit: 'mmol/L', min_value: 3.5, max_value: 5.5 },
          { parameter_code: 'CL', parameter_name: 'Chloride', machine_parameter_code: 'Cl', parameter_unit: 'mmol/L', min_value: 98, max_value: 107 }
        ]
      },
      {
        test_code: 'ELCA', test_name: 'Electrolyte with iCa', department: 'Biochemistry', sample_type: 'Whole Blood / Serum',
        parameters: [
          { parameter_code: 'NA', parameter_name: 'Sodium', machine_parameter_code: 'Na', parameter_unit: 'mmol/L', min_value: 135, max_value: 145 },
          { parameter_code: 'K', parameter_name: 'Potassium', machine_parameter_code: 'K', parameter_unit: 'mmol/L', min_value: 3.5, max_value: 5.5 },
          { parameter_code: 'CL', parameter_name: 'Chloride', machine_parameter_code: 'Cl', parameter_unit: 'mmol/L', min_value: 98, max_value: 107 },
          { parameter_code: 'ICA', parameter_name: 'Ionized Calcium', machine_parameter_code: 'iCa', parameter_unit: 'mmol/L', min_value: 1.10, max_value: 1.35 }
        ]
      },
      {
        test_code: 'ICA', test_name: 'Ionized Calcium', department: 'Biochemistry', sample_type: 'Whole Blood',
        parameters: [
          { parameter_code: 'ICA', parameter_name: 'Ionized Calcium', machine_parameter_code: 'iCa', parameter_unit: 'mmol/L', min_value: 1.10, max_value: 1.35 }
        ]
      },
      {
        test_code: 'LI', test_name: 'Serum Lithium', department: 'Biochemistry', sample_type: 'Serum',
        parameters: [
          { parameter_code: 'LI', parameter_name: 'Lithium', machine_parameter_code: 'Li', parameter_unit: 'mmol/L' }
        ]
      },
      {
        test_code: 'BGE', test_name: 'Blood Gas Electrolytes', department: 'Critical Care', sample_type: 'Arterial Blood',
        parameters: [
          { parameter_code: 'PH', parameter_name: 'pH', machine_parameter_code: 'pH', parameter_unit: 'pH', min_value: 7.35, max_value: 7.45 },
          { parameter_code: 'NA', parameter_name: 'Sodium', machine_parameter_code: 'Na', parameter_unit: 'mmol/L', min_value: 135, max_value: 145 },
          { parameter_code: 'K', parameter_name: 'Potassium', machine_parameter_code: 'K', parameter_unit: 'mmol/L', min_value: 3.5, max_value: 5.5 },
          { parameter_code: 'CL', parameter_name: 'Chloride', machine_parameter_code: 'Cl', parameter_unit: 'mmol/L', min_value: 98, max_value: 107 },
          { parameter_code: 'ICA', parameter_name: 'Ionized Calcium', machine_parameter_code: 'iCa', parameter_unit: 'mmol/L', min_value: 1.10, max_value: 1.35 }
        ]
      }
    ];

    // Predefined tests for Auto-Mapping
    const ANALYZER_TEST_TEMPLATES = {
      'HDC-Lyte Plus': HDC_LYTE_TEMPLATE,
      'HDC-LYTE PRO': HDC_LYTE_TEMPLATE,
      'CelQuant Edge': [
        {
          test_code: 'CBC', test_name: 'Complete Blood Count (CBC)', department: 'Hematology', sample_type: 'Whole Blood',
          parameters: [
            { parameter_code: 'WBC', parameter_name: 'WBC', machine_parameter_code: '6690-2', parameter_unit: '10^3/µL' },
            { parameter_code: 'RBC', parameter_name: 'RBC', machine_parameter_code: '789-8', parameter_unit: '10^6/µL' },
            { parameter_code: 'HGB', parameter_name: 'HGB', machine_parameter_code: '718-7', parameter_unit: 'g/dL' },
            { parameter_code: 'HCT', parameter_name: 'HCT', machine_parameter_code: '4544-3', parameter_unit: '%' },
            { parameter_code: 'MCH', parameter_name: 'MCH', machine_parameter_code: '785-6', parameter_unit: 'pg' },
            { parameter_code: 'MCHC', parameter_name: 'MCHC', machine_parameter_code: '786-4', parameter_unit: 'g/dL' },
            { parameter_code: 'RDW-CV', parameter_name: 'RDW-CV', machine_parameter_code: '788-0', parameter_unit: '%' },
            { parameter_code: 'PLT', parameter_name: 'PLT', machine_parameter_code: '777-3', parameter_unit: '10^3/µL' },
            { parameter_code: 'MPV', parameter_name: 'MPV', machine_parameter_code: '32623-1', parameter_unit: 'fL' },
            { parameter_code: 'LYMPH_PCT', parameter_name: 'Lymph%', machine_parameter_code: '736-9', parameter_unit: '%' },
            { parameter_code: 'MID_PCT', parameter_name: 'Mid%', machine_parameter_code: '10029', parameter_unit: '%' },
            { parameter_code: 'GRAN_PCT', parameter_name: 'Gran%', machine_parameter_code: '10030', parameter_unit: '%' }
          ]
        }
      ],
      'CliniQuant Micro': [
        {
          test_code: 'LFT', test_name: 'Liver Function Test', department: 'Biochemistry', sample_type: 'Serum',
          parameters: [
            { parameter_code: 'TBIL', parameter_name: 'TBIL', machine_parameter_code: '15', parameter_unit: 'mg/dL' },
            { parameter_code: 'DBIL', parameter_name: 'DBIL', machine_parameter_code: '20', parameter_unit: 'mg/dL' },
            { parameter_code: 'AST', parameter_name: 'AST', machine_parameter_code: '4', parameter_unit: 'U/L' },
            { parameter_code: 'ALT', parameter_name: 'ALT', machine_parameter_code: '2', parameter_unit: 'U/L' },
            { parameter_code: 'ALP', parameter_name: 'ALP', machine_parameter_code: '1', parameter_unit: 'U/L' },
            { parameter_code: 'TP', parameter_name: 'TP', machine_parameter_code: '23', parameter_unit: 'g/dL' },
            { parameter_code: 'ALB', parameter_name: 'ALB', machine_parameter_code: '14', parameter_unit: 'g/dL' }
          ]
        },
        {
          test_code: 'KFT', test_name: 'Kidney Function Test', department: 'Biochemistry', sample_type: 'Serum',
          parameters: [
            { parameter_code: 'UREA', parameter_name: 'UREA', machine_parameter_code: '12', parameter_unit: 'mg/dL' },
            { parameter_code: 'CREAT', parameter_name: 'CREAT', machine_parameter_code: '19', parameter_unit: 'mg/dL' },
            { parameter_code: 'URIC-ACID', parameter_name: 'URIC-ACID', machine_parameter_code: '13', parameter_unit: 'mg/dL' }
          ]
        },
        {
          test_code: 'LIPID', test_name: 'Lipid Profile', department: 'Biochemistry', sample_type: 'Serum',
          parameters: [
            { parameter_code: 'CHO', parameter_name: 'CHO', machine_parameter_code: '5', parameter_unit: 'mg/dL' },
            { parameter_code: 'TRIG', parameter_name: 'TRIG', machine_parameter_code: '11', parameter_unit: 'mg/dL' },
            { parameter_code: 'HDL', parameter_name: 'HDL', machine_parameter_code: '21', parameter_unit: 'mg/dL' }
          ]
        },
        {
          test_code: 'BS', test_name: 'Blood Sugar (F/PP/R)', department: 'Biochemistry', sample_type: 'Plasma',
          parameters: [
            { parameter_code: 'GLU', parameter_name: 'GLU', machine_parameter_code: '9', parameter_unit: 'mg/dL' }
          ]
        }
      ],
      'LAURA Smart': [
        {
          test_code: 'URM', test_name: 'Urine Routine & Microscopy (URM)', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'GLU', parameter_name: 'Glucose', machine_parameter_code: 'GLU', parameter_unit: '' },
            { parameter_code: 'BIL', parameter_name: 'Bilirubin', machine_parameter_code: 'BIL', parameter_unit: '' },
            { parameter_code: 'KET', parameter_name: 'Ketone', machine_parameter_code: 'KET', parameter_unit: '' },
            { parameter_code: 'SG', parameter_name: 'Specific Gravity', machine_parameter_code: 'SG', parameter_unit: '' },
            { parameter_code: 'BLD', parameter_name: 'Blood', machine_parameter_code: 'BLD', parameter_unit: '' },
            { parameter_code: 'PH', parameter_name: 'pH', machine_parameter_code: 'pH', parameter_unit: 'pH' },
            { parameter_code: 'PRO', parameter_name: 'Protein', machine_parameter_code: 'PRO', parameter_unit: '' },
            { parameter_code: 'UBG', parameter_name: 'Urobilinogen', machine_parameter_code: 'UBG', parameter_unit: '' },
            { parameter_code: 'NIT', parameter_name: 'Nitrite', machine_parameter_code: 'NIT', parameter_unit: '' },
            { parameter_code: 'LEU', parameter_name: 'Leukocytes', machine_parameter_code: 'LEU', parameter_unit: '' }
          ]
        },
        {
          test_code: 'URE', test_name: 'Urine Routine Examination (URE)', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'SG', parameter_name: 'Specific Gravity', machine_parameter_code: 'SG', parameter_unit: '' },
            { parameter_code: 'LEU', parameter_name: 'Leukocytes', machine_parameter_code: 'LEU', parameter_unit: '' },
            { parameter_code: 'NIT', parameter_name: 'Nitrite', machine_parameter_code: 'NIT', parameter_unit: '' },
            { parameter_code: 'PH', parameter_name: 'pH', machine_parameter_code: 'pH', parameter_unit: 'pH' },
            { parameter_code: 'PRO', parameter_name: 'Protein', machine_parameter_code: 'PRO', parameter_unit: '' },
            { parameter_code: 'GLU', parameter_name: 'Glucose', machine_parameter_code: 'GLU', parameter_unit: '' },
            { parameter_code: 'KET', parameter_name: 'Ketone', machine_parameter_code: 'KET', parameter_unit: '' },
            { parameter_code: 'UBG', parameter_name: 'Urobilinogen', machine_parameter_code: 'UBG', parameter_unit: '' },
            { parameter_code: 'BIL', parameter_name: 'Bilirubin', machine_parameter_code: 'BIL', parameter_unit: '' },
            { parameter_code: 'BLD', parameter_name: 'Blood', machine_parameter_code: 'BLD', parameter_unit: '' }
          ]
        },
        {
          test_code: 'UTI', test_name: 'UTI Screening', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'LEU', parameter_name: 'Leukocytes', machine_parameter_code: 'LEU', parameter_unit: '' },
            { parameter_code: 'NIT', parameter_name: 'Nitrite', machine_parameter_code: 'NIT', parameter_unit: '' }
          ]
        },
        {
          test_code: 'DUS', test_name: 'Diabetes Urine Screening', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'GLU', parameter_name: 'Glucose', machine_parameter_code: 'GLU', parameter_unit: '' },
            { parameter_code: 'KET', parameter_name: 'Ketone', machine_parameter_code: 'KET', parameter_unit: '' }
          ]
        },
        {
          test_code: 'KIDNEY', test_name: 'Kidney Screening', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'PRO', parameter_name: 'Protein', machine_parameter_code: 'PRO', parameter_unit: '' },
            { parameter_code: 'SG', parameter_name: 'Specific Gravity', machine_parameter_code: 'SG', parameter_unit: '' },
            { parameter_code: 'BLD', parameter_name: 'Blood', machine_parameter_code: 'BLD', parameter_unit: '' }
          ]
        },
        {
          test_code: 'LIVER', test_name: 'Liver Screening', department: 'Clinical Pathology', sample_type: 'Urine',
          parameters: [
            { parameter_code: 'UBG', parameter_name: 'Urobilinogen', machine_parameter_code: 'UBG', parameter_unit: '' },
            { parameter_code: 'BIL', parameter_name: 'Bilirubin', machine_parameter_code: 'BIL', parameter_unit: '' }
          ]
        }
      ],
      'ALTA Hematology': [
        {
          test_code: 'CBC', test_name: 'Complete Blood Count (CBC)', department: 'Hematology', sample_type: 'Whole Blood',
          parameters: [
            { parameter_code: 'WBC', parameter_name: 'WBC', machine_parameter_code: '2006', parameter_unit: '10^3/µL' },
            { parameter_code: 'NEU_PCT', parameter_name: 'NEU%', machine_parameter_code: '2007', parameter_unit: '%' },
            { parameter_code: 'LYM_PCT', parameter_name: 'LYM%', machine_parameter_code: '2008', parameter_unit: '%' },
            { parameter_code: 'MON_PCT', parameter_name: 'MON%', machine_parameter_code: '2009', parameter_unit: '%' },
            { parameter_code: 'EOS_PCT', parameter_name: 'EOS%', machine_parameter_code: '2010', parameter_unit: '%' },
            { parameter_code: 'BAS_PCT', parameter_name: 'BAS%', machine_parameter_code: '2011', parameter_unit: '%' },
            { parameter_code: 'NEU_ABS', parameter_name: 'NEU#', machine_parameter_code: '2012', parameter_unit: '10^3/µL' },
            { parameter_code: 'LYM_ABS', parameter_name: 'LYM#', machine_parameter_code: '2013', parameter_unit: '10^3/µL' },
            { parameter_code: 'MON_ABS', parameter_name: 'MON#', machine_parameter_code: '2014', parameter_unit: '10^3/µL' },
            { parameter_code: 'EOS_ABS', parameter_name: 'EOS#', machine_parameter_code: '2015', parameter_unit: '10^3/µL' },
            { parameter_code: 'BAS_ABS', parameter_name: 'BAS#', machine_parameter_code: '2016', parameter_unit: '10^3/µL' },
            { parameter_code: 'RBC', parameter_name: 'RBC', machine_parameter_code: '2017', parameter_unit: '10^6/µL' },
            { parameter_code: 'HGB', parameter_name: 'HGB', machine_parameter_code: '2018', parameter_unit: 'g/dL' },
            { parameter_code: 'MCV', parameter_name: 'MCV', machine_parameter_code: '2019', parameter_unit: 'fL' },
            { parameter_code: 'HCT', parameter_name: 'HCT', machine_parameter_code: '2020', parameter_unit: '%' },
            { parameter_code: 'MCH', parameter_name: 'MCH', machine_parameter_code: '2021', parameter_unit: 'pg' },
            { parameter_code: 'MCHC', parameter_name: 'MCHC', machine_parameter_code: '2022', parameter_unit: 'g/dL' },
            { parameter_code: 'RDW_SD', parameter_name: 'RDW-SD', machine_parameter_code: '2023', parameter_unit: 'fL' },
            { parameter_code: 'RDW_CV', parameter_name: 'RDW-CV', machine_parameter_code: '2024', parameter_unit: '%' },
            { parameter_code: 'PLT', parameter_name: 'PLT', machine_parameter_code: '2025', parameter_unit: '10^3/µL' },
            { parameter_code: 'MPV', parameter_name: 'MPV', machine_parameter_code: '2026', parameter_unit: 'fL' },
            { parameter_code: 'PCT', parameter_name: 'PCT', machine_parameter_code: '2027', parameter_unit: '%' },
            { parameter_code: 'PDW', parameter_name: 'PDW', machine_parameter_code: '2028', parameter_unit: '%' },
            { parameter_code: 'P_LCR', parameter_name: 'P-LCR', machine_parameter_code: '2029', parameter_unit: '%' },
            { parameter_code: 'P_LCC', parameter_name: 'P-LCC', machine_parameter_code: '2030', parameter_unit: '10^3/µL' },
            { parameter_code: 'CRP', parameter_name: 'CRP', machine_parameter_code: '2031', parameter_unit: 'mg/L' }
          ]
        }
      ]
    };

    const templates = ANALYZER_TEST_TEMPLATES[analyzer_name];
    if (!templates) {
      return res.status(400).json({ success: false, message: 'Unsupported analyzer for auto-mapping' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    let createdCount = 0;
    try {
      // Get all categories to match department name
      const [categories] = await connection.query('SELECT * FROM lab_categories');

      for (const tpl of templates) {
        // Ensure category exists
        let category = categories.find(c => c.name === tpl.department);
        if (!category) {
          const [catRes] = await connection.query('INSERT INTO lab_categories (name, description) VALUES (?, ?)', [tpl.department, tpl.department]);
          category = { id: catRes.insertId, name: tpl.department };
          categories.push(category);
        }

        // Check if test already exists for this exact lab AND analyzer AND test_code
        const [existing] = await connection.query(
          'SELECT id FROM lab_tests WHERE test_code = ? AND lab_id = ?',
          [tpl.test_code, lab_id]
        );

        let testId;
        if (existing.length === 0) {
          // If a global test with same code exists, we might suffix it, but usually test_code is unique per hospital. 
          // However, the schema might enforce test_code uniqueness globally. 
          // Let's try to insert, and handle duplicate test_code gracefully by suffixing Lab ID.
          
          let finalTestCode = tpl.test_code;
          const [globalExisting] = await connection.query('SELECT id FROM lab_tests WHERE test_code = ?', [finalTestCode]);
          if (globalExisting.length > 0) {
            finalTestCode = `${tpl.test_code}_${lab_id}`; 
          }

          const [testResult] = await connection.query(
            `INSERT INTO lab_tests
             (test_code, test_name, category_id, lab_id, sample_type, analyzer_name)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [finalTestCode, tpl.test_name, category.id, lab_id, tpl.sample_type, analyzer_name]
          );
          testId = testResult.insertId;
          createdCount++;

          // Insert parameters
          if (tpl.parameters && tpl.parameters.length > 0) {
            for (let i = 0; i < tpl.parameters.length; i++) {
              const param = tpl.parameters[i];
              await connection.query(
                `INSERT INTO lab_test_parameters 
                 (test_id, parameter_code, parameter_name, parameter_unit, result_type, min_value, max_value, display_order, machine_parameter_code) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  testId,
                  param.parameter_code || null,
                  param.parameter_name,
                  param.parameter_unit,
                  'numeric',
                  param.min_value || null,
                  param.max_value || null,
                  i + 1,
                  param.machine_parameter_code || null
                ]
              );
            }
          }
        }
      }

      await connection.commit();
      res.json({ success: true, message: `Successfully mapped ${createdCount} tests for ${analyzer_name} to the selected lab.`, count: createdCount });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error mapping analyzer tests:', error);
    res.status(500).json({ success: false, message: 'Server error mapping tests' });
  }
};

// Get labs from infrastructure (type = 'Lab') with workload
export const getLabs = async (req, res) => {
  try {
    // Get labs with their machine count and current workload
    const [labs] = await db.query(
      `SELECT i.id, i.name, i.block, i.floor, i.status, i.machines_count,
        (SELECT COUNT(*)
         FROM bill_items bi
         JOIN bills b ON bi.bill_id = b.id
         JOIN lab_tests lt ON bi.service_id = lt.id AND bi.service_type = 'Laboratory'
         WHERE lt.lab_id = i.id
         AND b.payment_status IN ('Pending', 'Partial')
         AND bi.status = 'Active') as pending_tasks
       FROM infrastructure i
       WHERE i.type = 'Lab' AND i.status = 'Available'
       ORDER BY i.name`
    );

    // Calculate workload score (pending_tasks / machines_count)
    const labsWithWorkload = labs.map(lab => ({
      ...lab,
      workload_score: lab.machines_count > 0
        ? (lab.pending_tasks / lab.machines_count).toFixed(2)
        : lab.pending_tasks,
      is_available: lab.status === 'Available'
    }));

    res.json({ success: true, labs: labsWithWorkload || [] });
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching labs' });
  }
};

// Get suggested lab for a test (fastest/least loaded)
export const getSuggestedLab = async (req, res) => {
  try {
    const { test_id } = req.query;

    // Get the test's default lab if set
    let defaultLabId = null;
    if (test_id) {
      const [testRows] = await db.query(
        'SELECT lab_id FROM lab_tests WHERE id = ?',
        [test_id]
      );
      if (testRows.length > 0) {
        defaultLabId = testRows[0].lab_id;
      }
    }

    // Get all available labs with workload
    const [labs] = await db.query(
      `SELECT i.id, i.name, i.block, i.floor, i.machines_count,
        (SELECT COUNT(*)
         FROM bill_items bi
         JOIN bills b ON bi.bill_id = b.id
         JOIN lab_tests lt ON bi.service_id = lt.id AND bi.service_type = 'Laboratory'
         WHERE lt.lab_id = i.id
         AND b.payment_status IN ('Pending', 'Partial')
         AND bi.status = 'Active') as pending_tasks
       FROM infrastructure i
       WHERE i.type = 'Lab' AND i.status = 'Available'
       ORDER BY i.name`
    );

    if (labs.length === 0) {
      return res.json({ success: true, suggested_lab: null, all_labs: [] });
    }

    // Calculate workload and find fastest lab
    const labsWithScore = labs.map(lab => {
      const workloadScore = lab.machines_count > 0
        ? lab.pending_tasks / lab.machines_count
        : lab.pending_tasks;
      return {
        ...lab,
        workload_score: workloadScore,
        estimated_wait_minutes: Math.round(workloadScore * 15) // 15 min per task estimate
      };
    });

    // Sort by workload score (ascending - least loaded first)
    labsWithScore.sort((a, b) => a.workload_score - b.workload_score);

    // If test has default lab and it's available, use it; otherwise use fastest
    let suggestedLab = labsWithScore[0]; // Fastest by default
    const defaultLab = defaultLabId ? labsWithScore.find(l => l.id === defaultLabId) : null;

    res.json({
      success: true,
      suggested_lab: defaultLab || suggestedLab,
      fastest_lab: labsWithScore[0],
      all_labs: labsWithScore,
      default_lab: defaultLab || null
    });
  } catch (error) {
    console.error('Error getting suggested lab:', error);
    res.status(500).json({ success: false, message: 'Server error getting suggested lab' });
  }
};

// ============================================
// LAB WORKLIST & SAMPLE COLLECTION
// ============================================

// Get worklist for lab technicians (pending tests by department)
export const getWorklist = async (req, res) => {
  try {
    const { department, branch_id, role_level } = req.query;

    // Base query to get pending lab tests from bills
    // Also check if results exist in lab_test_result
    let query = `
      SELECT 
        bi.id as bill_item_id,
        b.id as bill_id,
        b.bill_number,
        p.id as patient_id,
        p.reg_no,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        lt.id as test_id,
        lt.test_name,
        lt.test_code,
        lt.sample_type,
        lt.tube_color,
        lc.name as category_name,
        lc.name as department,
        CASE 
          WHEN tr.id IS NOT NULL THEN 'Test Done'
          ELSE bi.status
        END as status,
        bi.sample_id,
        bi.short_id,
        bi.lab_barcode,
        i.name as lab_name,
        b.created_at as bill_date,
        tr.id as result_id,
        tr.results_json,
        tr.tested_at as result_tested_at
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      JOIN lab_tests lt ON bi.service_id = lt.id
      LEFT JOIN lab_categories lc ON lt.category_id = lc.id
      LEFT JOIN infrastructure i ON bi.lab_id = i.id
      LEFT JOIN lab_test_result tr ON bi.sample_id = tr.sample_id
      WHERE bi.service_type = 'Laboratory'
      AND bi.status IN ('Pending', 'Collected', 'In Progress', 'Test Done')
      AND b.payment_status IN ('Pending', 'Partial', 'Paid')
      AND DATE(b.created_at) = CURDATE()
    `;

    const params = [];

    // Filter by branch context (Isolate data strictly to the user's physical hospital lab)
    if (branch_id && branch_id !== 'all') {
      query += ` AND b.branch_id = ?`;
      params.push(branch_id);
    }

    // Filter by department if specified
    if (department && department !== 'all') {
      query += ` AND LOWER(lc.name) = LOWER(?)`;
      params.push(department);
    }

    // Deduplicate any accidental double-billing of the exact same test on the same bill
    query += ` GROUP BY bi.bill_id, bi.service_id, bi.id, b.id, p.id, lt.id, lc.name, tr.id`;

    query += ` ORDER BY b.created_at ASC`;

    const [worklist] = await db.query(query, params);

    // Assign strictly sequential daily lab queue numbers based on unique bills
    let currentQueueNo = 1;
    const billQueueMap = {};

    const formattedWorklist = await Promise.all(worklist.map(async (item) => {
      if (!billQueueMap[item.bill_id]) {
        billQueueMap[item.bill_id] = currentQueueNo++;
      }

      let pending_params = [];
      if (item.status === 'In Progress' || item.status === 'Test Done') {
        // Fetch all required parameters for this specific test
        const [allParams] = await db.query(
          `SELECT parameter_name FROM lab_test_parameters WHERE test_id = ?`,
          [item.test_id]
        );

        let receivedNames = [];
        try {
          receivedNames = JSON.parse(item.results_json || '[]').map(r => r.parameter_name.toLowerCase());
        } catch (e) {
          receivedNames = [];
        }

        pending_params = allParams
          .filter(p => !receivedNames.includes(p.parameter_name.toLowerCase()))
          .map(p => p.parameter_name);
      }

      return {
        ...item,
        lab_queue_number: billQueueMap[item.bill_id],
        pending_params
      };
    }));

    res.json({
      success: true,
      worklist: formattedWorklist,
      count: formattedWorklist.length
    });
  } catch (error) {
    console.error('Error fetching worklist:', error);
    res.status(500).json({ success: false, message: 'Server error fetching worklist' });
  }
};

export const getWorklistById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT 
        bi.id as bill_item_id,
        b.id as bill_id,
        p.id as patient_id,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        lt.id as test_id,
        lt.test_name,
        bi.sample_id,
        bi.short_id,
        bi.status
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      JOIN lab_tests lt ON bi.service_id = lt.id
      WHERE (bi.sample_id = ? OR bi.short_id = ? OR bi.short_id LIKE ?)
      AND bi.status IN ('Pending', 'Collected', 'In Progress')
      LIMIT 1
    `, [id, id, `%${id.slice(-4)}`]);

    if (rows.length === 0) {
      return res.json({ success: false, message: 'No active test found' });
    }

    res.json({ success: true, test: rows[0] });
  } catch (error) {
    console.error('Error fetching worklist by id:', error);
    res.status(500).json({ success: false });
  }
};

// Generate sample ID sequence — atomic per branch+department per day, race-condition-proof
export const generateSampleId = async (req, res) => {
  try {
    const { branch_id, department } = req.body;

    if (!branch_id) {
      return res.status(400).json({ success: false, message: 'branch_id is required' });
    }

    // Department-based range (matches lab workflow convention)
    let startRange = 7000;
    if (department) {
      const dep = department.toLowerCase();
      if (dep.includes('hematology') || dep.includes('haematology')) {
        startRange = 1;
      } else if (dep.includes('biochem')) {
        startRange = 3000;
      } else if (dep.includes('serology') || dep.includes('microbiology') || dep.includes('pathology') || dep.includes('urine')) {
        startRange = 5000;
      }
    }

    const deptKey = startRange.toString();

    // Single atomic upsert per branch+department — no race condition possible
    await db.query(
      `INSERT INTO lab_sample_sequences (branch_id, seq_date, dept_key, last_seq)
       VALUES (?, CURDATE(), ?, ?)
       ON DUPLICATE KEY UPDATE last_seq = last_seq + 1`,
      [branch_id, deptKey, startRange]
    );

    const [[row]] = await db.query(
      `SELECT s.last_seq, b.hospital_code
       FROM lab_sample_sequences s
       JOIN branches b ON b.id = s.branch_id
       WHERE s.branch_id = ? AND s.seq_date = CURDATE() AND s.dept_key = ?`,
      [branch_id, deptKey]
    );

    const dateStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const shortId  = row.last_seq.toString().padStart(4, '0');
    const sampleId = `LAB-${row.hospital_code}-${dateStr}-${shortId}`;

    res.json({
      success: true,
      sequence: row.last_seq,
      sampleId,
      shortId
    });
  } catch (error) {
    console.error('Error generating sample ID:', error);
    res.status(500).json({ success: false, message: 'Server error generating sample ID' });
  }
};

// Track Test Status by Reference Number
export const trackTestStatus = async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    
    // The referenceNumber could be the bill_number or lab_barcode.
    const [rows] = await db.query(
      `SELECT bi.id, bi.service_name as test_name, bi.status as current_status,
              bi.created_at as billed_at, bi.updated_at,
              b.patient_name, b.bill_number,
              lr.status as report_status, lr.created_at as report_generated_at, lr.verified_at
       FROM bill_items bi
       JOIN bills b ON bi.bill_id = b.id
       LEFT JOIN lab_reports lr ON bi.id = lr.bill_item_id
       WHERE bi.lab_barcode = ? OR b.bill_number = ?`,
      [referenceNumber, referenceNumber]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid reference number. No tests found.' });
    }

    const test = rows[0];

    // Build the status tracking history
    const timeline = [];

    timeline.push({
      status: 'Billed',
      completed: true,
      timestamp: test.billed_at,
      description: 'Your lab test has been successfully booked.'
    });

    // Acknowledged
    const isAcknowledged = ['Collected', 'In Progress', 'Test Done', 'Completed'].includes(test.current_status);
    timeline.push({
      status: 'Acknowledged',
      completed: isAcknowledged,
      timestamp: isAcknowledged ? (test.current_status === 'Collected' ? test.updated_at : null) : null,
      description: 'Sample collection confirmed by the laboratory.'
    });

    // Test Done
    const isTestDone = ['Test Done', 'Completed'].includes(test.current_status);
    timeline.push({
      status: 'Test Done',
      completed: isTestDone,
      timestamp: isTestDone ? (test.current_status === 'Test Done' ? test.updated_at : null) : null,
      description: 'Laboratory analysis has been completed.'
    });

    // Waiting for doctor to verify
    const isWaitingVerify = !!test.report_status || test.current_status === 'Completed';
    timeline.push({
      status: 'Waiting for doctor to verify',
      completed: isWaitingVerify,
      timestamp: isWaitingVerify ? test.report_generated_at : null,
      description: 'Report generated and awaiting medical verification.'
    });

    // Test completed (Verified)
    const isCompleted = test.report_status === 'Verified';
    timeline.push({
      status: 'Test Completed',
      completed: isCompleted,
      timestamp: isCompleted ? test.verified_at : null,
      description: 'Report verified and ready for download.'
    });

    res.json({
      success: true,
      data: {
        patient_name: test.patient_name,
        test_name: test.test_name,
        reference_number: referenceNumber,
        current_status: test.current_status,
        timeline
      }
    });

  } catch (error) {
    console.error('Error tracking test:', error);
    res.status(500).json({ success: false, message: 'Server error tracking test status' });
  }
};

// Book lab tests for a patient
export const bookLabTests = async (req, res) => {
  try {
    const { regNo, tests, appointmentDate, appointmentTime, priority } = req.body;

    if (!regNo || !tests || !Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient registration number and tests are required'
      });
    }

    // Get patient by registration number
    const [patients] = await db.query(
      'SELECT id FROM patients WHERE reg_no = ?',
      [regNo]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patientId = patients[0].id;

    // Calculate total amount
    const totalAmount = tests.reduce((sum, test) => sum + (test.price || 0), 0);

    // Generate bill number
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const [billCount] = await db.query(
      'SELECT COUNT(*) as count FROM bills WHERE DATE(created_at) = CURDATE()'
    );
    const billNumber = `BILL-${date}-${(billCount[0].count + 1).toString().padStart(4, '0')}`;

    // Create bill
    const [billResult] = await db.query(
      `INSERT INTO bills (patient_id, bill_number, total_amount, payment_status, created_at, updated_at) 
       VALUES (?, ?, ?, 'Pending', NOW(), NOW())`,
      [patientId, billNumber, totalAmount]
    );

    const billId = billResult.insertId;

    // Create bill items for each test
    const billItems = [];
    for (const test of tests) {
      const price = test.price || 0;
      const [result] = await db.query(
        `INSERT INTO bill_items (bill_id, service_type, service_id, service_name, unit_price, total_price, status, created_at, updated_at)
         VALUES (?, 'Laboratory', ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
        [billId, test.test_id, test.test_name, price, price]
      );
      billItems.push({
        id: result.insertId,
        test_name: test.test_name,
        price: price
      });
    }

    res.json({
      success: true,
      message: 'Lab tests booked successfully',
      bill: {
        id: billId,
        bill_number: billNumber,
        total_amount: totalAmount,
        items: billItems
      }
    });
  } catch (error) {
    console.error('Error booking lab tests:', error);
    res.status(500).json({ success: false, message: 'Server error booking lab tests' });
  }
};

// Acknowledge test and update status
export const acknowledgeTest = async (req, res) => {
  try {
    const { bill_item_id, sample_id, short_id, status, collected_by } = req.body;

    if (!bill_item_id || !sample_id) {
      return res.status(400).json({
        success: false,
        message: 'Bill item ID and sample ID are required'
      });
    }

    // Update bill item with sample ID, status and collector
    const [result] = await db.query(
      `UPDATE bill_items 
       SET sample_id = ?, short_id = ?, status = ?, collected_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [sample_id, short_id || null, status || 'Collected', collected_by || null, bill_item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill item not found'
      });
    }

    // Automated WhatsApp Notification: Ping the NEXT two patients in line
    try {
      const [nextPatientsResult] = await db.query(
        `SELECT 
        b.patient_name,
        p.phone as patient_phone,
        b.id as bill_id,
        MIN(i.name) as lab_name
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        JOIN patients p ON b.patient_id = p.id
         LEFT JOIN infrastructure i ON bi.lab_id = i.id
         WHERE bi.service_type = 'Laboratory' 
           AND bi.status = 'Pending' 
           AND DATE(b.created_at) = CURDATE()
           AND b.id != (SELECT bill_id FROM bill_items WHERE id = ?)
         GROUP BY b.id, b.patient_name, b.patient_phone
         ORDER BY MIN(b.created_at) ASC
         LIMIT 2`,
         [bill_item_id]
      );

      for (let idx = 0; idx < nextPatientsResult.length; idx++) {
        const nextPatient = nextPatientsResult[idx];
        if (nextPatient.patient_phone) {
          // Find their queue number
          const [queueResult] = await db.query(
            `SELECT COUNT(DISTINCT b.id) as count 
             FROM bills b
             JOIN bill_items bi ON b.id = bi.bill_id
             WHERE DATE(b.created_at) = CURDATE() AND bi.service_type = 'Laboratory' AND b.id <= ?`,
            [nextPatient.bill_id]
          );
          const queueNumber = queueResult[0]?.count || 1;

          let formattedPhone = nextPatient.patient_phone.replace(/[^0-9]/g, '');
          if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;

          const assignedLabName = nextPatient.lab_name || 'the Main Laboratory';

          let textMsg = '';
          if (idx === 0) {
            textMsg = `🏥 *HIMS Lab Notification*\nHello ${nextPatient.patient_name}, the patient before you has just been called.\n\n*Now it's your turn!* Please proceed to *${assignedLabName} LAB*. Your Token is *#${queueNumber}*.`;
          } else if (idx === 1) {
            textMsg = `🏥 *HIMS Lab Notification*\nHello ${nextPatient.patient_name}, there is *1 more patient* ahead of you.\n\nPlease make sure you have reached *${assignedLabName} LAB* so you are ready when called. Your Token is *#${queueNumber}*.`;
          }

          const msgData = JSON.stringify({
            phone: formattedPhone,
            text: textMsg
          });

          const botUrl = new URL(process.env.WHATSAPP_BOT_URL || 'http://localhost:3000');
          const req = http.request({
            hostname: botUrl.hostname,
            port: botUrl.port || (botUrl.protocol === 'https:' ? 443 : 80),
            path: '/send-message',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(msgData)
            }
          });
          req.on('error', e => console.log('WhatsApp HTTP error:', e.message));
          req.write(msgData);
          req.end();
        }
      }
    } catch (notifyErr) {
      console.error('Error sending next patient notification:', notifyErr);
    }

    res.json({
      success: true,
      message: 'Test acknowledged successfully',
      sample_id,
      status: status || 'Collected'
    });
  } catch (error) {
    console.error('Error acknowledging test:', error);
    res.status(500).json({ success: false, message: 'Server error acknowledging test' });
  }
};

// Update test status (for In Progress, Completed)
export const updateTestStatus = async (req, res) => {
  try {
    const { bill_item_id, status } = req.body;

    if (!bill_item_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Bill item ID and status are required'
      });
    }

    const validStatuses = ['Pending', 'Collected', 'In Progress', 'Test Done', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const [result] = await db.query(
      `UPDATE bill_items 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, bill_item_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill item not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      status
    });
  } catch (error) {
    console.error('Error updating test status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

/**
 * Get Lab Activity Logs (Audit Trail)
 */
export const getActivityLogs = async (req, res) => {
  const { branch_id, search, limit = 50 } = req.query;
  try {
    let query = `
      SELECT 
        bi.id as bill_item_id,
        bi.sample_id,
        bi.service_name as test_name,
        bi.status as current_status,
        bi.created_at as billed_at,
        bi.updated_at as status_updated_at,
        p.id as patient_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        ltr.tested_at,
        ltr.verified_at,
        ltr.machine_no,
        ltr.status as result_status,
        -- Billed By
        CONCAT(bu.first_name, ' ', bu.last_name) as billed_by_name,
        -- Acknowledged By
        CONCAT(cu.first_name, ' ', cu.last_name) as acknowledged_by_name,
        -- Run By
        CONCAT(tu.first_name, ' ', tu.last_name) as technician_name,
        -- Verified By
        CONCAT(vu.first_name, ' ', vu.last_name) as verifier_name,
        -- Approved By
        CONCAT(au.first_name, ' ', au.last_name) as approver_name
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      JOIN patients p ON b.patient_id = p.id
      LEFT JOIN lab_test_result ltr ON bi.id = ltr.bill_item_id
      LEFT JOIN users bu ON b.created_by = bu.id
      LEFT JOIN users cu ON bi.collected_by = cu.id
      LEFT JOIN users tu ON ltr.tested_by = tu.id
      LEFT JOIN users vu ON ltr.verified_by = vu.id
      LEFT JOIN users au ON ltr.approved_by = au.id
      WHERE bi.service_type = 'Laboratory'
    `;
    const params = [];

    if (search) {
      query += ` AND (bi.sample_id LIKE ? OR p.first_name LIKE ? OR bi.service_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY bi.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [logs] = await db.query(query, params);
    res.json({ success: true, logs });
  } catch (err) {
    console.error('getActivityLogs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================
// TEST RESULTS - PARAMETER BASED
// ============================================

// Save test results from lab machine
export const saveTestResults = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      sample_id,
      machine_no,
      bill_item_id,
      test_id,
      test_name,
      results, // Array of parameter results
      tested_by,
      patient_id,
      status: requestedStatus,
    } = req.body;

    // Only allow machine-facing statuses; default to 'Test Done' so results
    // always land in the verification queue rather than being auto-approved.
    const resultStatus = ['Test Done', 'In Progress'].includes(requestedStatus)
      ? requestedStatus
      : 'Test Done';

    // Validate required fields
    if (!sample_id || !results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sample_id and results array are required'
      });
    }

    const testedAt = new Date();

    // Look up patient_id and lab_id from bill_items if not provided
    let resolvedPatientId = patient_id;
    let labId = null;
    
    const [billItem] = await connection.query(
      `SELECT b.patient_id, bi.lab_id FROM bill_items bi 
       JOIN bills b ON bi.bill_id = b.id 
       WHERE bi.sample_id = ? OR bi.id = ? LIMIT 1`,
      [sample_id, bill_item_id || null]
    );
    
    if (billItem && billItem.length > 0) {
      if (!resolvedPatientId) resolvedPatientId = billItem[0].patient_id;
      labId = billItem[0].lab_id;
    }

    // CHECK IF RESULTS ALREADY EXIST FOR THIS BILL ITEM (TO APPEND/UPSERT)
    const [existing] = await connection.query(
      `SELECT id, results_json FROM lab_test_result WHERE bill_item_id = ? LIMIT 1`,
      [bill_item_id]
    );

    if (existing && existing.length > 0) {
      // APPEND LOGIC
      let currentResults = [];
      try {
        currentResults = JSON.parse(existing[0].results_json || '[]');
      } catch (e) {
        currentResults = [];
      }

      // Merge new results into existing (overwrite if same parameter name)
      results.forEach(newRes => {
        const idx = currentResults.findIndex(r => r.parameter_name === newRes.parameter_name);
        if (idx !== -1) {
          currentResults[idx] = newRes;
        } else {
          currentResults.push(newRes);
        }
      });

      await connection.query(
        `UPDATE lab_test_result
         SET results_json = ?, machine_no = ?, tested_at = NOW(), status = ?
         WHERE id = ?`,
        [JSON.stringify(currentResults), machine_no || null, resultStatus, existing[0].id]
      );
      var finalResultId = existing[0].id;
    } else {
      // INSERT LOGIC (First parameter for this test)
      const [insertResult] = await connection.query(
        `INSERT INTO lab_test_result
         (bill_item_id, patient_id, sample_id, machine_no, test_id, test_name,
          results_json, tested_by, tested_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bill_item_id || null,
          resolvedPatientId || null,
          sample_id,
          machine_no || null,
          test_id || null,
          test_name || null,
          JSON.stringify(results),
          tested_by || null,
          testedAt,
          resultStatus,
        ]
      );
      var finalResultId = insertResult.insertId;
    }

    // Update bill item to 'Test Done' so it appears in the verification queue.
    // Do NOT mark as Completed here — that requires explicit doctor verification/approval.
    if (bill_item_id) {
      await connection.query(
        `UPDATE bill_items SET status = 'Test Done', updated_at = NOW() WHERE id = ?`,
        [bill_item_id]
      );
    } else {
      await connection.query(
        `UPDATE bill_items SET status = 'Test Done', updated_at = NOW() WHERE sample_id = ?`,
        [sample_id]
      );
    }

    // ============================================
    // AUTO-DEDUCT INVENTORY LOGIC
    // ============================================
    if (test_id && labId) {
      // Find mappings
      const [mappings] = await connection.query(
        'SELECT item_id, quantity_required FROM inventory_test_mapping WHERE test_id = ?',
        [test_id]
      );

      for (const mapping of mappings) {
        let remainingToDeduct = parseFloat(mapping.quantity_required);

        // Fetch available batches for this item at this lab (branch), ordered by expiry (FIFO)
        const [batches] = await connection.query(
          `SELECT id, quantity_available FROM inventory_batches 
           WHERE item_id = ? AND branch_id = ? AND quantity_available > 0 AND status = 'Active'
           ORDER BY expiry_date ASC`,
          [mapping.item_id, labId]
        );

        for (const batch of batches) {
          if (remainingToDeduct <= 0) break;

          const deductQty = Math.min(batch.quantity_available, remainingToDeduct);
          
          // Deduct from batch
          await connection.query(
            `UPDATE inventory_batches SET quantity_available = quantity_available - ? WHERE id = ?`,
            [deductQty, batch.id]
          );

          // Log transaction
          await connection.query(
            `INSERT INTO inventory_transactions (item_id, batch_id, type, quantity, reference_type, reference_id, remarks, branch_id, created_by, test_id)
             VALUES (?, ?, 'OUT', ?, 'Test', ?, 'Auto-deducted for test execution', ?, ?, ?)`,
            [mapping.item_id, batch.id, deductQty, sample_id, labId, tested_by || null, test_id]
          );

          // Update batch status if depleted
          await connection.query(
            `UPDATE inventory_batches SET status = 'Empty' WHERE id = ? AND quantity_available <= 0`,
            [batch.id]
          );

          remainingToDeduct -= deductQty;
        }
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Test results saved successfully',
      data: {
        result_id: finalResultId,
        sample_id,
        machine_no,
        results_count: results.length,
        tested_at: testedAt
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error saving test results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving test results',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get test results by sample_id
export const getTestResultsBySampleId = async (req, res) => {
  try {
    const { sampleId } = req.params;

    const [rows] = await db.query(
      `SELECT 
        tr.id,
        tr.sample_id,
        tr.machine_no,
        tr.test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.status,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no
      FROM lab_test_result tr
      LEFT JOIN bill_items bi ON tr.bill_item_id = bi.id
      LEFT JOIN bills b ON bi.bill_id = b.id
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE tr.sample_id = ?
      ORDER BY tr.created_at DESC
      LIMIT 1`,
      [sampleId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this sample ID'
      });
    }

    const result = rows[0];

    // Parse JSON results
    let resultsArray = [];
    try {
      resultsArray = typeof result.results_json === 'string'
        ? JSON.parse(result.results_json)
        : result.results_json;
    } catch (e) {
      resultsArray = [];
    }

    res.json({
      success: true,
      sample_id: sampleId,
      machine_no: result.machine_no,
      test_name: result.test_name,
      patient_name: result.patient_name,
      patient_reg_no: result.reg_no,
      tested_at: result.tested_at,
      status: result.status,
      results_count: resultsArray.length,
      results: resultsArray
    });

  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching test results'
    });
  }
};

// Get pending verifications for Lab Head Doctor
export const getPendingVerifications = async (req, res) => {
  try {
    const { status } = req.query;

    let statusFilter = "tr.status IN ('Test Done', 'Verified', 'Completed')";
    if (status && status !== 'all') {
      statusFilter = "tr.status = ?";
    }

    const [tests] = await db.query(
      `SELECT 
        tr.id,
        tr.sample_id,
        tr.machine_no,
        lt.test_name as test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.verified_by,
        tr.verified_at,
        tr.status,
        tr.notes,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no,
        CONCAT(u.first_name, ' ', u.last_name) as tested_by_name

      FROM lab_test_result tr
      JOIN bill_items bi ON tr.sample_id = bi.sample_id
      LEFT JOIN lab_tests lt ON bi.service_id = lt.id
      LEFT JOIN bills b ON bi.bill_id = b.id
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON tr.tested_by = u.id

      WHERE ${statusFilter} AND (p.reg_no NOT LIKE 'ANL-%' OR p.reg_no IS NULL)

      ORDER BY tr.tested_at DESC`,
      status && status !== 'all' ? [status] : []
    );

    // Parse JSON results for each test
    const formattedTests = tests.map(test => {
      let results = [];
      try {
        results = typeof test.results_json === 'string'
          ? JSON.parse(test.results_json)
          : test.results_json;
      } catch (e) {
        results = [];
      }

      return {
        ...test,
        results
      };
    });

    res.json({
      success: true,
      count: formattedTests.length,
      tests: formattedTests
    });

  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pending verifications'
    });
  }
};



// Verify test by Lab Head Doctor
export const verifyTest = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      test_result_id,
      sample_id,
      verified_by,
      status, // 'Verified' or 'Approved'
      notes
    } = req.body;

    // Validate required fields
    if (!test_result_id || !sample_id || !verified_by || !status) {
      return res.status(400).json({
        success: false,
        message: 'test_result_id, sample_id, verified_by, and status are required'
      });
    }

    const validStatuses = ['Verified', 'Approved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Verified or Approved'
      });
    }

    const verifiedAt = new Date();

    // Update test result with verification details
    // If status is Approved, we also set approved_by
    await connection.query(
      `UPDATE lab_test_result 
       SET verified_by = ?, 
           verified_at = ?, 
           approved_by = CASE WHEN ? = 'Approved' THEN ? ELSE approved_by END,
           status = ?,
           notes = COALESCE(?, notes),
           updated_at = NOW()
       WHERE id = ? AND sample_id = ?`,
      [verified_by, verifiedAt, status, verified_by, status, notes || null, test_result_id, sample_id]
    );

    // Also update bill_items status if status is Approved
    if (status === 'Approved') {
      await connection.query(
        `UPDATE bill_items 
         SET status = 'Completed', 
             updated_at = NOW() 
         WHERE sample_id = ?`,
        [sample_id]
      );

      // --- AUTOMATED WHATSAPP PDF SEND ---
      try {
        const query = `
          SELECT 
            tr.id,
            tr.sample_id,
            tr.test_name,
            tr.results_json,
            tr.tested_at,
            tr.verified_at,
            tr.notes,
            CONCAT(p.first_name, ' ', p.last_name) as patient_name,
            p.reg_no as patient_reg_no,
            p.gender,
            p.dob,
            p.telephone as patient_phone,
            doc_user.phone as doctor_phone,
            CONCAT(doc_user.first_name, ' ', doc_user.last_name) as doctor_name,
            CONCAT(ut.first_name, ' ', ut.last_name) as tested_by_name,
            CONCAT(uv.first_name, ' ', uv.last_name) as verified_by_name,
            i.name as lab_name
          FROM lab_test_result tr
          LEFT JOIN bill_items bi ON tr.sample_id = bi.sample_id
          LEFT JOIN bills b ON bi.bill_id = b.id
          LEFT JOIN patients p ON b.patient_id = p.id
          LEFT JOIN doctor_lab_orders dlo ON dlo.test_id = bi.test_id AND dlo.patient_reg_no = p.reg_no
          LEFT JOIN doctors doc_ref ON dlo.doctor_id = doc_ref.id
          LEFT JOIN users doc_user ON doc_ref.user_id = doc_user.id
          LEFT JOIN users ut ON tr.tested_by = ut.id
          LEFT JOIN users uv ON tr.verified_by = uv.id
          LEFT JOIN infrastructure i ON bi.lab_id = i.id
          WHERE tr.sample_id = ?
          LIMIT 1
        `;
        const [rows] = await connection.query(query, [sample_id]);
        
        if (rows && rows.length > 0) {
          const report = rows[0];
          // We prioritize the doctor's phone, but if not available (e.g. unsolicited tests), we silently skip or fallback based on preference
          if (report.doctor_phone) {
             let formattedPhone = report.doctor_phone.replace(/[^0-9]/g, '');
             if (formattedPhone.length === 10) formattedPhone = '91' + formattedPhone;
             
             let results = [];
             try { results = typeof report.results_json === 'string' ? JSON.parse(report.results_json) : report.results_json; } catch(e){}
             
             let age = 'N/A';
             if (report.dob) {
               const birthDate = new Date(report.dob);
               const today = new Date();
               let ageYears = today.getFullYear() - birthDate.getFullYear();
               age = ageYears + ' Y';
             }
             
             const formatDate = (date) => {
               if (!date) return 'N/A';
               return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'}).replace(',', '');
             };
             
             const reportUrl = `${req.protocol || 'http'}://${req.get('host') || 'localhost:7005'}/api/lab/generate-report-pdf/${sample_id}`;
             
             // Fetch hospital settings for branding
             const [settingsRows] = await db.query(`SELECT * FROM hospital_settings LIMIT 1`);
             const hospitalSettings = settingsRows.length > 0 ? settingsRows[0] : null;

             const reportData = {
               hospital_settings: hospitalSettings,
               patient_name: report.patient_name || 'Unknown',
               patient_reg_no: report.patient_reg_no || 'N/A',
               sample_id: report.sample_id,
               gender: report.gender || 'N/A',
               age: age,
               referred_by: 'Self',
               centre: report.lab_name || hospitalSettings?.hospital_name || 'MERIL HIMS',
               registration_date: formatDate(report.tested_at),
               tested_by_name: report.tested_by_name || 'N/A',
               tested_at: formatDate(report.tested_at),
               verified_by_name: report.verified_by_name || 'N/A',
               verified_at: formatDate(report.verified_at),
               report_url: reportUrl,
               tests: [{
                 test_name: report.test_name || 'Lab Test',
                 sample_type: 'Blood Sample',
                 accession_no: report.sample_id,
                 collected_on: formatDate(report.tested_at),
                 received_on: formatDate(report.tested_at),
                 approved_on: formatDate(report.verified_at),
                 remarks: report.notes || 'Please correlate results clinically.',
                 parameters: results.map(r => ({
                   parameter_name: r.parameter_name || r.parameter_code || 'Unknown',
                   result_value: r.result_value || '',
                   unit: r.unit || '',
                   reference_range: r.reference_range || '',
                   result_flag: (r.result_flag || 'normal').toLowerCase(),
                   is_subheader: r.is_subheader || false
                 }))
               }]
             };
             
             const doc = await generateLabReportPDFStream(reportData);
             const chunks = [];
             doc.on('data', chunk => chunks.push(chunk));
             doc.on('end', () => {
               const pdfBuffer = Buffer.concat(chunks);
               const base64Pdf = pdfBuffer.toString('base64');
               
               const msgData = JSON.stringify({
                 phone: formattedPhone,
                 text: `🏥 *HIMS Lab Report Alert*\nHello Dr. ${report.doctor_name || 'Doctor'},\n\nA new lab report for your patient *${report.patient_name || 'Unknown'}* (${report.patient_reg_no || 'N/A'}) is ready.\n\n*Test:* ${report.test_name || 'Lab Test'}\n*Verified by:* ${report.verified_by_name || 'N/A'}\n\nPlease find the PDF attached below.`,
                 media: base64Pdf,
                 filename: `${(report.test_name || 'Lab_Report').replace(/[^a-zA-Z0-9]/g, '_')}_${report.patient_name || 'Patient'}.pdf`
               });
               
               const botUrl = new URL(process.env.WHATSAPP_BOT_URL || 'http://localhost:3000');
               const httpReq = http.request({
                 hostname: botUrl.hostname,
                 port: botUrl.port || (botUrl.protocol === 'https:' ? 443 : 80),
                 path: '/send-message',
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json',
                   'Content-Length': Buffer.byteLength(msgData)
                 }
               });
               httpReq.on('error', e => console.log('WhatsApp HTTP error:', e.message));
               httpReq.write(msgData);
               httpReq.end();
             });
          }
        }
      } catch (pdfErr) {
        console.error('Error generating PDF for WhatsApp:', pdfErr);
      }
      // --- END AUTOMATED WHATSAPP PDF SEND ---
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Test ${status.toLowerCase()} successfully`,
      data: {
        test_result_id,
        sample_id,
        status,
        verified_by,
        verified_at: verifiedAt
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error verifying test:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying test'
    });
  } finally {
    connection.release();
  }
};

// Get approved reports for download
// Get approved reports for download
export const getApprovedReports = async (req, res) => {
  try {
    const { search, from, to } = req.query;

    let query = `
      SELECT 
        tr.id,
        tr.sample_id,
        tr.test_name,
        tr.tested_at,
        tr.verified_at,
        tr.verified_by,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        p.telephone as patient_phone,
        CONCAT(u.first_name, ' ', u.last_name) as verified_by_name
      FROM lab_test_result tr
      LEFT JOIN patients p ON tr.patient_id = p.id
      LEFT JOIN users u ON tr.verified_by = u.id
      LEFT JOIN bill_items bi ON tr.sample_id = bi.sample_id
      LEFT JOIN bills b ON bi.bill_id = b.id
      WHERE tr.status = 'Approved'
    `;

    const params = [];

    if (search) {
      // Check if search is purely numeric (could be a Token No)
      const isNumeric = !isNaN(search) && search.trim() !== '';
      
      if (isNumeric) {
        query += ` AND (
          tr.sample_id LIKE ? OR 
          p.first_name LIKE ? OR 
          p.last_name LIKE ? OR 
          tr.test_name LIKE ? OR
          (
            SELECT COUNT(DISTINCT b2.id) 
            FROM bills b2 
            WHERE DATE(b2.created_at) = DATE(b.created_at) AND b2.id <= b.id
          ) = ?
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, parseInt(search));
      } else {
        query += ` AND (
          tr.sample_id LIKE ? OR 
          p.first_name LIKE ? OR 
          p.last_name LIKE ? OR 
          tr.test_name LIKE ?
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
    }

    if (from) {
      query += ` AND DATE(tr.verified_at) >= ?`;
      params.push(from);
    }

    if (to) {
      query += ` AND DATE(tr.verified_at) <= ?`;
      params.push(to);
    }

    query += ` ORDER BY tr.verified_at DESC`;

    const [reports] = await db.query(query, params);

    res.json({
      success: true,
      count: reports.length,
      reports
    });

  } catch (error) {
    console.error('Error fetching approved reports:', error);

    res.status(500).json({
      success: false,
      message: 'Server error fetching approved reports'
    });
  }
};

// Get detailed report by sample_id
export const getReportDetails = async (req, res) => {
  try {
    const { sampleId } = req.params;

    const [rows] = await db.query(
      `SELECT 
        tr.id,
        tr.sample_id,
        tr.machine_no,
        tr.test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.verified_by,
        tr.verified_at,
        tr.notes,
        tr.status,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        CONCAT(ut.first_name, ' ', ut.last_name) as tested_by_name,
        CONCAT(uv.first_name, ' ', uv.last_name) as verified_by_name
      FROM lab_test_result tr
      LEFT JOIN patients p ON tr.patient_id = p.id
      LEFT JOIN users ut ON tr.tested_by = ut.id
      LEFT JOIN users uv ON tr.verified_by = uv.id
      WHERE tr.sample_id = ? AND tr.status = 'Approved'
      ORDER BY tr.verified_at DESC
      LIMIT 1`,
      [sampleId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or not approved'
      });
    }

    const report = rows[0];

    // Parse JSON results
    let results = [];
    try {
      results = typeof report.results_json === 'string'
        ? JSON.parse(report.results_json)
        : report.results_json;
    } catch (e) {
      results = [];
    }

    res.json({
      success: true,
      id: report.id,
      sample_id: report.sample_id,
      machine_no: report.machine_no,
      test_name: report.test_name,
      patient_name: report.patient_name,
      patient_reg_no: report.patient_reg_no,
      tested_by_name: report.tested_by_name,
      tested_at: report.tested_at,
      verified_by_name: report.verified_by_name,
      verified_at: report.verified_at,
      notes: report.notes,
      status: report.status,
      results_count: results.length,
      results
    });

  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching report details'
    });
  }
};

// Generate PDF report - Professional HOD Style

export const generateLabReportPDF = async (req, res) => {
  try {
    const { sampleId } = req.params;

    // Fetch report with patient, user, lab info
    const query = `
      SELECT 
        tr.id,
        tr.sample_id,
        tr.machine_no,
        tr.test_name,
        tr.results_json,
        tr.tested_by,
        tr.tested_at,
        tr.verified_by,
        tr.verified_at,
        tr.notes,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.reg_no as patient_reg_no,
        p.gender,
        p.dob,
        CONCAT(ut.first_name, ' ', ut.last_name) as tested_by_name,
        CONCAT(uv.first_name, ' ', uv.last_name) as verified_by_name,
        i.name as lab_name
      FROM lab_test_result tr
      LEFT JOIN patients p ON tr.patient_id = p.id
      LEFT JOIN users ut ON tr.tested_by = ut.id
      LEFT JOIN users uv ON tr.verified_by = uv.id
      LEFT JOIN bill_items bi ON tr.bill_item_id = bi.id
      LEFT JOIN infrastructure i ON bi.lab_id = i.id
      WHERE tr.sample_id = ? AND tr.status = 'Approved'
      ORDER BY tr.verified_at DESC
      LIMIT 1
    `;
    const [rows] = await db.query(query, [sampleId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or not approved'
      });
    }

    const report = rows[0];

    // Parse JSON results
    let results = [];
    try {
      results = typeof report.results_json === 'string'
        ? JSON.parse(report.results_json)
        : report.results_json;
    } catch (e) {
      results = [];
    }

    // Calculate age from DOB if available
    let age = 'N/A';
    if (report.dob) {
      const birthDate = new Date(report.dob);
      const today = new Date();
      let ageYears = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageYears--;
      }
      age = ageYears + ' Y';
    }

    // Format dates
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', '');
    };

    // Build report URL for QR code - Now points to the PDF download endpoint for instant verification
    const reportUrl = `${req.protocol}://${req.get('host')}/api/lab/generate-report-pdf/${sampleId}`;

    // Fetch hospital settings for branding
    const [settingsRows] = await db.query(`SELECT * FROM hospital_settings LIMIT 1`);
    const hospitalSettings = settingsRows.length > 0 ? settingsRows[0] : null;

    // Transform database results to PDF format
    const reportData = {
      hospital_settings: hospitalSettings,
      patient_name: report.patient_name || 'Unknown',
      patient_reg_no: report.patient_reg_no || 'N/A',
      sample_id: report.sample_id,
      gender: report.gender || 'N/A',
      age: age,
      referred_by: 'Self', // Could be fetched from doctor if available
      centre: report.lab_name || hospitalSettings?.hospital_name || 'MERIL HIMS',
      registration_date: formatDate(report.tested_at),
      tested_by_name: report.tested_by_name || 'N/A',
      tested_at: formatDate(report.tested_at),
      verified_by_name: report.verified_by_name || 'N/A',
      verified_at: formatDate(report.verified_at),
      report_url: reportUrl,
      tests: [{
        test_name: report.test_name || 'Lab Test',
        sample_type: 'Blood Sample',
        accession_no: report.sample_id,
        collected_on: formatDate(report.tested_at),
        received_on: formatDate(report.tested_at),
        approved_on: formatDate(report.verified_at),
        remarks: report.notes || 'Please correlate results clinically.',
        parameters: results.map(r => ({
          parameter_name: r.parameter_name || r.parameter_code || 'Unknown',
          result_value: r.result_value || '',
          unit: r.unit || '',
          reference_range: r.reference_range || '',
          result_flag: (r.result_flag || 'normal').toLowerCase(),
          is_subheader: r.is_subheader || false
        }))
      }]
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${sampleId}.pdf"`);

    // Generate and stream PDF using professional HOD-style generator
    const doc = await generateLabReportPDFStream(reportData);
    doc.pipe(res);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating PDF'
    });
  }
};

// Get hospital code for machine ID generation
export const getHospitalCode = async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.query(
      `SELECT hospital_code FROM branches WHERE id = (SELECT branch_id FROM users WHERE id = ?)`,
      [userId]
    );
    if (rows.length === 0) {
      return res.json({ success: true, hospital_code: 'LAB' }); // Fallback
    }
    res.json({ success: true, hospital_code: rows[0].hospital_code });
  } catch (error) {
    console.error('Error fetching hospital code:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get machine protocol JSON for dynamic parsing in LIS Agent
export const getMachineProtocol = async (req, res) => {
  try {
    const { model } = req.params;
    const path = `./utils/machinesid.json/${model.toLowerCase()}.json`;
    
    const fs = await import('fs/promises');
    const data = await fs.readFile(path, 'utf8');
    const protocol = JSON.parse(data);
    
    res.json({ success: true, protocol });
  } catch (error) {
    console.error('Error fetching machine protocol:', error);
    res.status(404).json({ success: false, message: 'Protocol not found for this model' });
  }
};

// Create an unsolicited worklist entry for analyzer results that don't match an active test
export const createUnsolicitedWorklist = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { sample_id, patient_name, test_name } = req.body;

    if (!sample_id) {
      return res.status(400).json({ success: false, message: 'Sample ID is required' });
    }

    // Check if it already exists
    const [existing] = await connection.query(`SELECT id FROM bill_items WHERE sample_id = ?`, [sample_id]);
    if (existing.length > 0) {
      // Return existing
      const [rows] = await connection.query(`
        SELECT bi.id as bill_item_id, b.id as bill_id, p.id as patient_id,
          CONCAT(p.first_name, ' ', p.last_name) as patient_name,
          lt.id as test_id, lt.test_name, bi.sample_id, bi.short_id, bi.status
        FROM bill_items bi JOIN bills b ON bi.bill_id = b.id JOIN patients p ON b.patient_id = p.id
        LEFT JOIN lab_tests lt ON bi.service_id = lt.id WHERE bi.sample_id = ? LIMIT 1
      `, [sample_id]);
      await connection.commit();
      return res.json({ success: true, test: rows[0] });
    }

    // 1. Resolve Patient
    let pName = patient_name ? patient_name.replace(/\^/g, ' ').trim() : 'Unknown Patient';
    let patientId;
    
    // If we have a real name, try to find them, else create a new patient
    if (pName !== 'Unknown Patient') {
      const [pts] = await connection.query(`SELECT id FROM patients WHERE CONCAT(first_name, ' ', last_name) = ? OR first_name = ? LIMIT 1`, [pName, pName]);
      if (pts.length > 0) {
        patientId = pts[0].id;
      } else {
        const regNo = `ANL-${Date.now()}`;
        const [insPt] = await connection.query(`
          INSERT INTO patients (reg_no, reg_date, first_name, last_name, telephone, gender) 
          VALUES (?, NOW(), ?, '', '0000000000', 'Other')`, [regNo, pName]);
        patientId = insPt.insertId;
      }
    } else {
      // Fallback dummy patient
      const [pts] = await connection.query(`SELECT id FROM patients WHERE first_name = 'Unknown Patient' LIMIT 1`);
      if (pts.length > 0) {
        patientId = pts[0].id;
      } else {
        const regNo = `ANL-${Date.now()}`;
        const [insPt] = await connection.query(`
          INSERT INTO patients (reg_no, reg_date, first_name, last_name, telephone, gender) 
          VALUES (?, NOW(), 'Unknown Patient', '', '0000000000', 'Other')`, [regNo]);
        patientId = insPt.insertId;
      }
    }

    // 2. Find a generic lab test for the analyzer
    let testId = null;
    let tName = test_name || 'Unmapped Analyzer Test';
    const [tests] = await connection.query(`SELECT id, test_name FROM lab_tests WHERE test_name = ? OR test_name = 'Unmapped Analyzer Test' LIMIT 1`, [tName]);
    if (tests.length > 0) {
      testId = tests[0].id;
      tName = tests[0].test_name;
    } else {
      const tCode = `UNM-${Date.now().toString().slice(-6)}`;
      const [cats] = await connection.query('SELECT id FROM lab_categories LIMIT 1');
      const catId = cats.length > 0 ? cats[0].id : 1;
      const [insT] = await connection.query(`INSERT INTO lab_tests (test_code, test_name, category_id, sample_type, price) VALUES (?, ?, ?, 'Serum', 0)`, [tCode, tName, catId]);
      testId = insT.insertId;
    }

    // 3. Create Bill
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const [billCount] = await connection.query('SELECT COUNT(*) as count FROM bills WHERE DATE(created_at) = CURDATE()');
    const billNumber = `BILL-${date}-${(billCount[0].count + 1).toString().padStart(4, '0')}`;
    const [billResult] = await connection.query(
      `INSERT INTO bills (patient_id, bill_number, total_amount, payment_status, created_at, updated_at) VALUES (?, ?, 0, 'Paid', NOW(), NOW())`,
      [patientId, billNumber]
    );
    const billId = billResult.insertId;

    // 4. Create Bill Item
    const shortId = sample_id.slice(-4);
    const [biResult] = await connection.query(
      `INSERT INTO bill_items (bill_id, service_type, service_id, service_name, unit_price, total_price, status, sample_id, short_id, created_at, updated_at)
       VALUES (?, 'Laboratory', ?, ?, 0, 0, 'In Progress', ?, ?, NOW(), NOW())`,
      [billId, testId, tName, sample_id, shortId]
    );

    await connection.commit();

    const newTest = {
      bill_item_id: biResult.insertId,
      bill_id: billId,
      patient_id: patientId,
      patient_name: pName,
      test_id: testId,
      test_name: tName,
      sample_id: sample_id,
      short_id: shortId,
      status: 'In Progress'
    };

    res.json({ success: true, test: newTest });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating unsolicited worklist:', error);
    res.status(500).json({ success: false, message: 'Server error creating unsolicited worklist' });
  } finally {
    connection.release();
  }
};


export const mapUnmappedTest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { sample_id, patient_reg_no } = req.body;
    if (!sample_id || !patient_reg_no) {
      return res.status(400).json({ success: false, message: 'Sample ID and Patient CRN are required.' });
    }

    await connection.beginTransaction();

    // 1. Find the real patient by CRN
    const [realPatients] = await connection.query(`SELECT id, CONCAT(first_name, ' ', last_name) as name, telephone FROM patients WHERE reg_no = ? LIMIT 1`, [patient_reg_no]);
    if (realPatients.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Patient not found with that CRN.' });
    }
    const realPatient = realPatients[0];

    // 2. Find the bill item to get the bill_id and test_id
    const [billItems] = await connection.query(`SELECT bill_id, service_id as test_id FROM bill_items WHERE sample_id = ? LIMIT 1`, [sample_id]);
    if (billItems.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Test not found for that Sample ID.' });
    }
    const billId = billItems[0].bill_id;

    // 3. Update the bills table to the real patient
    await connection.query(`UPDATE bills SET patient_id = ? WHERE id = ?`, [realPatient.id, billId]);

    // 4. Update lab_test_result (if it exists) to the real patient
    await connection.query(`UPDATE lab_test_result SET patient_id = ? WHERE sample_id = ?`, [realPatient.id, sample_id]);

    await connection.commit();

    res.json({ success: true, message: 'Patient successfully mapped.', patient: realPatient.name });

  } catch (error) {
    await connection.rollback();
    console.error('Error mapping unsolicited test:', error);
    res.status(500).json({ success: false, message: 'Server error mapping test.' });
  } finally {
    connection.release();
  }
};

// ── Kiosk: fetch patient reports by phone or ABHA ────────────────────────────
export const getKioskReports = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Enter at least 4 digits' });
    }

    const q = query.trim();

    // Find patient by telephone or abha_id
    const [patients] = await db.query(
      `SELECT id, first_name, last_name, telephone, abha_id
       FROM patients
       WHERE telephone LIKE ? OR abha_id = ?
       LIMIT 5`,
      [`%${q}%`, q]
    );

    if (patients.length === 0) {
      return res.json({ success: true, patient: null, reports: [] });
    }

    const patient = patients[0];

    // Fetch approved reports from last 7 days
    const [reports] = await db.query(
      `SELECT
         tr.id, tr.sample_id, tr.test_name,
         tr.verified_at, tr.status,
         bi.service_name,
         b.bill_number,
         CONCAT(u.first_name, ' ', u.last_name) as verified_by_name
       FROM lab_test_result tr
       LEFT JOIN bill_items bi ON tr.sample_id = bi.sample_id
       LEFT JOIN bills b       ON bi.bill_id   = b.id
       LEFT JOIN users u       ON tr.verified_by = u.id
       WHERE tr.patient_id = ?
         AND tr.status = 'Approved'
         AND tr.verified_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY tr.verified_at DESC`,
      [patient.id]
    );

    res.json({
      success: true,
      patient: {
        name: `${patient.first_name} ${patient.last_name}`.trim(),
        phone: patient.telephone,
        abha_id: patient.abha_id
      },
      reports
    });
  } catch (error) {
    console.error('Kiosk reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
