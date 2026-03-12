@echo off
subst Z: "C:\Users\Rohit S\RMS-Installer" 2>nul
Z:
cd \installer\robs-backend
set DATABASE_URL=postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public
node Z:\installer\node_modules\prisma\build\index.js validate --schema=Z:\installer\robs-backend\prisma\schema.prisma > Z:\installer\robs-backend\z-out.txt 2>&1
node Z:\installer\node_modules\prisma\build\index.js generate --schema=Z:\installer\robs-backend\prisma\schema.prisma >> Z:\installer\robs-backend\z-out.txt 2>&1
echo DONE.
