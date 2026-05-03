import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const generateToken = (id, role, branch_id, role_level) => {
  return jwt.sign({ id, role, branch_id, role_level }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  const { firstName, lastName, email, phone, role, department, staffId, password, role_level = 'Branch', newBranchName, newHospitalCode, newDistrictId } = req.body;
  let { branch_id = 1 } = req.body;

  try {
    // Check if user exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Handle new branch creation
    if (branch_id === 'NEW' && newBranchName && newHospitalCode && newDistrictId) {
      try {
        const [branchResult] = await db.query(
          `INSERT INTO branches (district_id, branch_name, category, hospital_code, status, branch_level) VALUES (?, ?, 'General Hospital', UPPER(?), 'Active', 'Center')`,
          [newDistrictId, newBranchName, newHospitalCode]
        );
        branch_id = branchResult.insertId;
      } catch (branchErr) {
        if (branchErr.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Hospital Code already exists' });
        }
        throw branchErr;
      }
    }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user query
      const query = `
        INSERT INTO users (first_name, last_name, email, phone, role, department, staff_id, password, branch_id, role_level) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [firstName, lastName, email, phone || null, role, department, staffId || null, hashedPassword, branch_id, role_level];

    const [result] = await db.query(query, values);

    if (result.insertId) {
      res.status(201).json({
        id: result.insertId,
        firstName,
        lastName,
        email,
        role,
        branch_id,
        role_level,
        token: generateToken(result.insertId, role, branch_id, role_level),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    
    // Check if table missing error (ER_NO_SUCH_TABLE)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Database tables not created yet.' });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(`
      SELECT u.*, b.hospital_code, b.district_id
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.email = ?
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id,
      role_level: user.role_level,
      hospital_code: user.hospital_code,
      district_id: user.district_id,
      token: generateToken(user.id, user.role, user.branch_id, user.role_level),
    });
  } catch (error) {
    console.error(error);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Database tables not created yet.' });
    }
    
    res.status(500).json({ message: 'Server error during login' });
  }
};
