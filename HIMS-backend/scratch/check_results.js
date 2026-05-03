
import db from '../config/db.js';

async function checkTables() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log("Tables:", tables);
    
    const [results] = await db.query('SELECT * FROM lab_test_result');
    console.log("Results count:", results.length);
    if (results.length > 0) {
        console.log("Latest result:", JSON.stringify(results[results.length-1], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTables();
