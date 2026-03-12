# RMS Installer Project

This project contains the isolated installer for the Restaurant Management System (RMS).

## Structure

- `installer/`: The main folder containing the installer codebase.
  - `bootstrap.bat` / `bootstrap.sh`: Scripts to start the installer.
  - `scripts/setup.js`: The main orchestration script.
  - `robs-backend/src/installer/`: Backend logic for the installer.
  - `robs-backend/installer-ui/`: Frontend UI for the installer.
  - `Installer images/`: Assets used by the installer UI.

## How to Run

1. Navigate to the `installer/` directory.
2. Run `npm run installer` or execute the `bootstrap.bat` script.

## Notes

- This project is a standalone copy of the installer components from the original RMS repository.
- No logic or behavior has been changed during the extraction process.
- Relative paths have been preserved to maintain functionality.
