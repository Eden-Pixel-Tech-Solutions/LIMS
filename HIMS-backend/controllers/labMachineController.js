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

// Get network machines for dashboard (grouped by branch)
export const getNetworkMachines = async (req, res) => {
  try {
    const query = `
      SELECT
        i.name AS branchName,
        lm.id AS db_id,
        lm.machine_id AS id,
        CONCAT(lm.manufacturer, ' ', lm.model) AS name,
        lm.model AS type,
        lm.status AS status,
        lm.serial_number,
        (
          SELECT COUNT(*) FROM lab_test_result ltr
          WHERE ltr.machine_no = lm.machine_id
          AND ltr.tested_at >= NOW() - INTERVAL 1 DAY
        ) AS testsDone
      FROM lab_machines lm
      LEFT JOIN infrastructure i ON lm.lab_id = i.id
      ORDER BY i.name ASC, lm.machine_id ASC
    `;
    const [rows] = await db.query(query);

    // Group by branchName
    const grouped = rows.reduce((acc, curr) => {
      let branch = acc.find(b => b.branchName === curr.branchName);
      if (!branch) {
        branch = { branchName: curr.branchName || 'Unassigned Lab', machines: [] };
        acc.push(branch);
      }
      branch.machines.push({
        id: curr.id || curr.serial_number,
        name: curr.name,
        type: curr.type || 'Unknown Analyzer',
        status: curr.status || 'Offline',
        testsDone: curr.testsDone || 0
      });
      return acc;
    }, []);

    res.json({ success: true, data: grouped });
  } catch (error) {
    console.error('Error fetching network machines:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get machine by Serial Number
export const getMachineBySerial = async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const [machines] = await db.query(
      'SELECT * FROM lab_machines WHERE serial_number = ? LIMIT 1',
      [serialNumber]
    );
    if (machines.length === 0) {
      return res.json({ success: false, message: 'Machine not found' });
    }
    res.json({ success: true, machine: machines[0] });
  } catch (error) {
    console.error('Error fetching machine by serial:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add or Update machine (Cloud Sync)
export const syncLabMachine = async (req, res) => {
  try {
    const { 
      lab_id, machine_id, name, model, manufacturer, 
      serial_number, interface_type, port_ip, baud_rate 
    } = req.body;

    if (!serial_number) {
      return res.status(400).json({ success: false, message: 'Serial number is required for syncing' });
    }

    // Check if machine with this serial exists
    const [existing] = await db.query('SELECT id FROM lab_machines WHERE serial_number = ?', [serial_number]);

    if (existing.length > 0) {
      // Update existing record
      const query = `
        UPDATE lab_machines 
        SET lab_id = ?, machine_id = ?, name = ?, model = ?, manufacturer = ?, 
            interface_type = ?, port_ip = ?, baud_rate = ?, updated_at = NOW()
        WHERE serial_number = ?
      `;
      await db.query(query, [
        lab_id, machine_id, name, model, manufacturer, 
        interface_type, port_ip, baud_rate, serial_number
      ]);
      res.json({ success: true, message: 'Machine synced (Updated)', id: existing[0].id });
    } else {
      // Insert new record
      const query = `
        INSERT INTO lab_machines 
        (lab_id, machine_id, name, model, manufacturer, serial_number, interface_type, port_ip, baud_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        lab_id, machine_id, name, model, manufacturer, 
        serial_number, interface_type, port_ip, baud_rate
      ]);
      res.status(201).json({ success: true, message: 'Machine synced (Created)', id: result.insertId });
    }
  } catch (error) {
    console.error('Error syncing lab machine:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addLabMachine = async (req, res) => {
  // Keeping for backward compatibility or direct additions
  try {
    const { lab_id, machine_id, name, model, manufacturer } = req.body;
    const query = 'INSERT INTO lab_machines (lab_id, machine_id, name, model, manufacturer) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [lab_id, machine_id, name, model || '', manufacturer || '']);
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ success: false }); }
};

export const updateLabMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, manufacturer, status } = req.body;
    await db.query('UPDATE lab_machines SET name = ?, model = ?, manufacturer = ?, status = ? WHERE id = ?', [name, model, manufacturer, status, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
};

export const deleteLabMachine = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM lab_machines WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
};
