import db from '../config/db.js';

export const getSettings = async (req, res) => {
  try {
    const [settings] = await db.query(`SELECT * FROM hospital_settings LIMIT 1`);
    if (settings.length > 0) {
      res.json({ success: true, data: settings[0] });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { hospital_name, logo_url, address, phone, website, email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_name } = req.body;
    
    const [existing] = await db.query(`SELECT id FROM hospital_settings LIMIT 1`);
    if (existing.length > 0) {
      await db.query(
        `UPDATE hospital_settings SET hospital_name=?, logo_url=?, address=?, phone=?, website=?, email=?,
         smtp_host=?, smtp_port=?, smtp_user=?, smtp_pass=?, smtp_from_name=? WHERE id=?`,
        [hospital_name, logo_url, address, phone, website, email,
         smtp_host, smtp_port || 587, smtp_user, smtp_pass, smtp_from_name, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO hospital_settings (hospital_name, logo_url, address, phone, website, email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hospital_name, logo_url, address, phone, website, email, smtp_host, smtp_port || 587, smtp_user, smtp_pass, smtp_from_name]
      );
    }
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
