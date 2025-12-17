import bcrypt from 'bcrypt';
import fs from 'fs';

const hash = await bcrypt.hash('password123', 10);
fs.writeFileSync('hash.txt', hash);
console.log('Hash written to hash.txt');
