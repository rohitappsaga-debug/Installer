
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');
const ENV_BAK_PATH = path.join(process.cwd(), '.env.bak');
const ENV_TMP_PATH = path.join(process.cwd(), '.env.tmp');

/**
 * Robustly writes environment variables to .env file.
 * Creates a backup before writing and uses an atomic write pattern.
 */
export const writeEnv = async (envVars: Record<string, string>) => {
    // 1. Create Backup if .env exists
    if (fs.existsSync(ENV_PATH)) {
        try {
            fs.copyFileSync(ENV_PATH, ENV_BAK_PATH);
        } catch (e) {
            console.error('Failed to create .env backup:', e);
            // Continue anyway, but not ideal
        }
    }

    // 2. Read current content to merge
    let currentEnvContent = '';
    if (fs.existsSync(ENV_PATH)) {
        currentEnvContent = fs.readFileSync(ENV_PATH, 'utf-8');
    }

    const envMap = parseEnv(currentEnvContent);

    // 3. Update with new values
    Object.keys(envVars).forEach(key => {
        envMap.set(key, envVars[key]);
    });

    // 4. Construct new content
    let newContent = '';
    // Preserve some order if possible, or just alphabetical
    const sortedKeys = Array.from(envMap.keys()).sort();
    sortedKeys.forEach(key => {
        newContent += `${key}=${envMap.get(key)}\n`;
    });

    // 5. Atomic Write (Write to TMP, then rename)
    try {
        fs.writeFileSync(ENV_TMP_PATH, newContent);
        if (os_platform_is_win()) {
            // fs.renameSync on Windows fails if target exists
            if (fs.existsSync(ENV_PATH)) {
                fs.unlinkSync(ENV_PATH);
            }
        }
        fs.renameSync(ENV_TMP_PATH, ENV_PATH);
    } catch (err: any) {
        throw new Error(`Failed to write .env file: ${err.message}`);
    }
};

const os_platform_is_win = () => process.platform === 'win32';

/**
 * Parses .env content into a Map, preserving existing values.
 */
const parseEnv = (content: string): Map<string, string> => {
    const map = new Map<string, string>();
    const lines = content.split(/\r?\n/);
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            map.set(key, val);
        }
    });
    return map;
};
