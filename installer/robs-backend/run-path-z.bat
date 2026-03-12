@echo off
subst Z: "C:\Users\Rohit S\RMS-Installer" 2>nul
Z:
cd \installer\robs-backend
node test-paths.js > z-path-out.txt 2>&1
echo DONE >> z-path-out.txt
