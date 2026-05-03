import db from '../config/db.js';

// Get all machines for a lab
export const getLabMachines = async (req, res) => {
  try {
    const { labId } = req.params;
    const [machines] = await db.query(
      'SELECT * FROM lab_machines WHERE lab_id = ? ORDER BY created_at DESC',
      [labId]
    );
    res.json({ success: true, machines });
  } catch (error) {
    console.error('Error fetching lab machines:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a new machine
export const addLabMachine = async (req, res) => {
  try {
    const { lab_id, machine_id, name, model, manufacturer } = req.body;

    if (!lab_id || !machine_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Lab ID, Machine ID, and Name are required'
      });
    }

    const query = `
      INSERT INTO lab_machines (lab_id, machine_id, name, model, manufacturer)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [lab_id, machine_id, name, model || '', manufacturer || '']);

    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding lab machine:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Machine ID already exists for this lab'
      });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update machine
export const updateLabMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, manufacturer, status } = req.body;

    const query = `
      UPDATE lab_machines
      SET name = ?, model = ?, manufacturer = ?, status = ?
      WHERE id = ?
    `;
    await db.query(query, [name, model, manufacturer, status, id]);

    res.json({ success: true, message: 'Machine updated successfully' });
  } catch (error) {
    console.error('Error updating lab machine:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete machine
export const deleteLabMachine = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM lab_machines WHERE id = ?', [id]);
    res.json({ success: true, message: 'Machine deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab machine:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
