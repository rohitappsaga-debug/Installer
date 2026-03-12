@echo off
subst Z: "C:\Users\Rohit S\RMS-Installer" 2>nul
Z:
cd \installer\robs-backend
set DATABASE_URL=postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public
node test-prisma-client.js > z-test-out.txt 2>&1
echo DONE >> z-test-out.txt
