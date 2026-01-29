const bcrypt = require('bcryptjs')

// Generate a proper password hash
const password = 'admin123' // Change this to a secure password
const hashedPassword = bcrypt.hashSync(password, 10)

console.log('Password:', password)
console.log('Hashed Password:', hashedPassword)
console.log('')
console.log('Run this SQL in your Supabase SQL editor:')
console.log(`UPDATE public.admin_users SET password_hash = '${hashedPassword}' WHERE email = 'admin@beacon.app';`)