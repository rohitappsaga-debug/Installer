@echo off
subst Z: "C:\Users\Rohit S\RMS-Installer" 2>nul
Z:
cd \installer\robs-backend
set DATABASE_URL=postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public
node node_modules\prisma\build\index.js -v > z-v-out.txt 2>&1
echo DONE >> z-v-out.txt
