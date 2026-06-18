require('dotenv').config();
console.log('Parsed password length:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
console.log('Parsed password raw:', JSON.stringify(process.env.ADMIN_PASSWORD));
console.log('Trimmed password length:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim().length : 0);
