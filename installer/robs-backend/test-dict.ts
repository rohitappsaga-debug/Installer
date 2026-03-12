const { COMMON_PASSWORDS } = require('./src/installer/services/passwordDictionary.ts');
console.log(`Dictionary contains ${COMMON_PASSWORDS.length} passwords.`);
// Printing a random sample to be sure
console.log('Sample:', COMMON_PASSWORDS.slice(900, 915));
