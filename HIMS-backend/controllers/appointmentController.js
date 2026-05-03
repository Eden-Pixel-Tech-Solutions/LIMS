import db from '../config/db.js';

export const bookAppointment = async (req, res) => {
  try {
    const { regNo, department, doctor, priority, apptDate, apptTime, reason } = req.body;

    if (!regNo || !department || !apptDate) {
      return res.status(400).json({ success: false, message: 'RegNo, Department, and Date are required' });
    }

    const query = `
      INSERT INTO appointments (
        reg_no, department, doctor, priority, appt_date, appt_time, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [regNo, department, doctor, priority || 'Routine', apptDate, apptTime, reason];

    const [result] = await db.query(query, values);

    res.status(201).json({ 
      success: true, 
      message: 'Appointment booked successfully', 
      appointmentId: result.insertId 
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: 'Server error booking appointment' });
  }
};
