
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const LOCK_FILE = path.join(process.cwd(), 'installed.lock');

export const checkInstallerLock = (req: Request, res: Response, next: NextFunction) => {
    if (fs.existsSync(LOCK_FILE)) {
        return res.status(403).json({
            error: 'Installer is locked. The application is already installed.',
            message: 'To reinstall, please delete the "installed.lock" file manually from the server root.'
        });
    }
    next();
};
