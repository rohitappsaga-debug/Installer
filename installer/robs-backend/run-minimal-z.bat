@echo off
subst Z: "C:\Users\Rohit S\RMS-Installer" 2>nul
Z:
cd \installer\robs-backend
set DATABASE_URL=postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public
set PRISMA_CLI_QUERY_ENGINE_TYPE=library
set PRISMA_CLIENT_ENGINE_TYPE=library
node test-prisma-minimal.js > z-minimal-log.txt 2>&1
echo DONE >> z-minimal-log.txt
