
/**
 * A comprehensive list of common passwords and variations to brute-force
 * initial access to a local PostgreSQL instance.
 */
export const COMMON_PASSWORDS = [
    'root', 'postgres', 'admin', 'password', '123456', '12345678', '12345', '123456789',
    'qwerty', '1234', 'password123', 'root123', 'admin123', 'postgres123', 'P@ssword',
    'guest', 'user', 'sysadmin', 'database', 'dbadmin', 'mypassword', '111111', '123123',
    '654321', '888888', 'Letmein1', 'Welcome1', 'Changeme', 'Iloveu', 'dragon', 'football',
    'monkey', 'superman', 'shadow', 'master', 'postgre', 'psql', 'Pgsql', 'ROMS', 'rms'
];

// Generate automated variations to reach 1000+
const years = Array.from({ length: 15 }, (_, i) => (2010 + i).toString());
const patterns = ['@', '!', '123', '1', '2024', '2025', 'P@ss', 'Admin', 'Root'];
const bases = ['Postgres', 'Admin', 'Root', 'Rms', 'Restaurant', 'Password', 'User'];

for (const base of bases) {
    for (const year of years) {
        COMMON_PASSWORDS.push(`${base}${year}`);
        COMMON_PASSWORDS.push(`${base}@${year}`);
        COMMON_PASSWORDS.push(`${base}!${year}`);
        COMMON_PASSWORDS.push(`${base.toLowerCase()}${year}`);
        COMMON_PASSWORDS.push(`${base.toLowerCase()}@${year}`);
        COMMON_PASSWORDS.push(`${base.toLowerCase()}!${year}`);
    }
    for (const p of patterns) {
        COMMON_PASSWORDS.push(`${base}${p}`);
        COMMON_PASSWORDS.push(`${base.toLowerCase()}${p}`);
        COMMON_PASSWORDS.push(`${p}${base}`);
        COMMON_PASSWORDS.push(`${p}${base.toLowerCase()}`);
    }
}

// Ensure unique values and cap/trim if needed
export const DICTIONARY = Array.from(new Set(COMMON_PASSWORDS)).slice(0, 1500);
