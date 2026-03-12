
import { Router } from 'express';
import {
    getSystemRequirements,
    getDatabaseStatus,
    autoSetupPostgres,
    autoSetupPostgresStream,
    configureDatabase,
    getAppSettings,
    saveAppSettings,
    startInstallation,
    restartServer,
    verifyLicense,
    checkLicenseStatus
} from './controllers';
import { checkInstallerLock } from './middleware';

const router = Router();

// Restart route is allowed even if locked
router.post('/restart', restartServer);

// Apply lock check to configuration routes
router.use(checkInstallerLock);

router.post('/license/verify', verifyLicense);
router.get('/license/status', checkLicenseStatus);
router.get('/check', getSystemRequirements);
router.get('/postgres/status', getDatabaseStatus);
router.post('/postgres/auto-setup', autoSetupPostgres);
router.get('/postgres/auto-setup/stream', autoSetupPostgresStream);

// Aliases for compatibility if needed
router.get('/database/status', getDatabaseStatus);
router.post('/postgres/auto-install', autoSetupPostgres);

router.post('/database/configure', configureDatabase);
router.get('/settings', getAppSettings);
router.post('/settings', saveAppSettings);
router.get('/install/run', startInstallation);

export default router;
