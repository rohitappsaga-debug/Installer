@echo off
Z:
cd \robs-backend\prisma
set DATABASE_URL=postgresql://restaurant_user:rohit5237@localhost:5432/restaurant_db?schema=public
node Z:\node_modules\prisma\build\index.js generate
