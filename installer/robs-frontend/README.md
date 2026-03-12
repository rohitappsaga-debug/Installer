# ROBS Web Installer UI

This directory contains the frontend code for the Restaurant Order Booking System (ROBS) Web Installer.

## Overview

The Installer UI is a React application built with Vite and Tailwind CSS. It provides a user-friendly wizard interface to guide administrators through the initial setup process of the ROBS application.

## Development

To work on the Installer UI:

1.  Navigate to this directory:
    ```bash
    cd installer-ui
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

    The UI will be available at `http://localhost:3005`.
    **Note:** You need the backend installer server running for API requests to work.

## Build

The build output is configured to be placed in `../src/installer/public`. This allows the backend to serve the installer UI statically.

To build the project:

```bash
npm run build
```

This command runs `tsc` (TypeScript Compiler) and `vite build`.

## Project Structure

*   `src/components/installer`: Contains the step components (Welcome, Requirements, Database, etc.)
*   `src/api.ts`: API client for communicating with the installer backend.
*   `src/App.tsx`: Main application component.
*   `src/index.css`: Global styles and Tailwind directives.

## Technologies

*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   Lucide React (Icons)
