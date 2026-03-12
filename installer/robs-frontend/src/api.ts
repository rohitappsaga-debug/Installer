
import axios from 'axios';

const api = axios.create({
    baseURL: '/api/install',
});

/**
 * Check system requirements.
 * Cache-Control: no-store ensures every call (including Re-check) hits the
 * server fresh and never returns a stale result from a browser/proxy cache.
 */
export const checkSystem = () =>
    api.get('/check', { headers: { 'Cache-Control': 'no-store' } });

export const checkDbStatus = () => api.get('/database/status');
export const getPgStatus = () => api.get('/postgres/status');
export const autoSetupPostgres = (config: any) => api.post('/postgres/auto-setup', config);
export const installDb = () => api.post('/database/install');
export const autoInstallPostgres = (config: any) => api.post('/postgres/auto-setup', config);
export const configureDb = (config: any) => api.post('/database/configure', config);
export const getSettings = () => api.get('/settings');
export const saveSettings = (settings: any) => api.post('/settings', settings);
export const verifyLicense = (licenseKey: string) => api.post('/license/verify', { license_key: licenseKey });
export const checkLicenseStatus = () => api.get('/license/status');
export const restartInstaller = () => api.post('/restart');

export default api;
