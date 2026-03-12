# Restaurant Management System - Complete Documentation

## Introduction
Welcome to the Restaurant Management System (RMS)! This is a complete, modern solution for managing a restaurant's day-to-day operations. It connects the Waiters, Kitchen, and Admin in real-time to ensure orders are processed smoothly and efficiently.

**Key Features:**
*   **Real-time Ordering:** Waiters place orders on tablets/mobiles, and they appear instantly in the kitchen.
*   **Kitchen Display System (KDS):** Chefs see what to prepare and mark items as "Ready".
*   **Table Management:** Visual layout of tables to track occupancy and reservations.
*   **Admin Dashboard:** Track sales, manage menu items, and view staff performance.
*   **Smart Reservations:** Automatically manages table availability based on reservations.

---

## 1. System Requirements
Before you start, ensure your computer has the following installed:

*   **Node.js**: Version 18 or higher. [Download Here](https://nodejs.org/)
*   **PostgreSQL**: A running PostgreSQL database instance. [Download Here](https://www.postgresql.org/download/)
*   **Git**: To manage the code. [Download Here](https://git-scm.com/)
*   **Web Browser**: Chrome, Firefox, or Edge.

---

## 2. Environment Setup
The system has two parts: **Backend** (Server) and **Frontend** (User Interface). Both need configuration.

### Backend Setup (`robs-backend-1/.env`)
1.  Navigate to `robs-backend-1`.
2.  Copy `env.example` to a new file named `.env`.
3.  Open `.env` and update the following if needed:

```env
# Database Connection (IMPORTANT: Update password)
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db?schema=public"

# App Port
PORT=3000

# Security Secrets (Change for production)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend URL (For CORS)
CORS_ORIGIN=http://localhost:3002
```
*Note: If your frontend runs on a different port (e.g., 5173 created by Vite), update `CORS_ORIGIN`.*

### Frontend Setup (`robs-frontend/.env`)
1.  Navigate to `robs-frontend`.
2.  Create a file named `.env` (if not exists).
3.  Add the backend URL:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## 3. Installation Steps (Step-by-Step)

### Step 1: Install Backend Dependencies
Open your terminal/command prompt:
```bash
cd "robs-backend"
npm install
```

### Step 2: Install Frontend Dependencies
Open a **new** terminal window:
```bash
cd "robs-frontend"
npm install
```

---

## 4. Database Setup

### Step 1: Create PostgreSQL Database
First, create a PostgreSQL database named `restaurant_db`:

**Using psql command line:**
```bash
psql -U postgres
CREATE DATABASE restaurant_db;
\q
```

**Using pgAdmin:**
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Enter database name: `restaurant_db`
5. Click "Save"

### Step 2: Configure Environment Variables
1. Navigate to the project root directory
2. Copy `.env.example` to `.env` in the `robs-backend-1` folder:
   ```bash
   cd "Restaurant Management System"
   copy .env.example robs-backend-1\.env
   ```
3. Open `robs-backend-1\.env` and update your database credentials:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/restaurant_db?schema=public"
   ```
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

### Step 3: Import Demo Data
You have two options to import the demo database:

**Option A: Using psql (Command Line)**
```bash
psql -U postgres -d restaurant_db -f database/demo_database.sql
```

**Option B: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Right-click on the `restaurant_db` database
3. Select "Restore"
4. Click the folder icon to browse files
5. Navigate to and select `database/demo_database.sql`
6. Click "Restore"

### Alternative: Use Prisma (If demo data not needed)
If you want to start fresh without demo data:

```bash
cd robs-backend

# Generate Prisma Client
npm run db:generate

# Push schema to database (Create tables)
npm run db:push

# (Optional) Seed default data (Admin, Waiter, Menu Items)
npm run db:seed
```

---

## 5. Pusher Setup (Optional)

> **Note:** This system uses **Socket.io** for real-time communication by default. Pusher configuration is **optional** and only needed if you want to use Pusher for additional real-time features or integrations.

### What is Pusher?
Pusher is a hosted service that provides real-time communication capabilities. While the Restaurant Management System uses Socket.io for its core real-time features, you can optionally integrate Pusher for additional functionality.

### Step 1: Create a Pusher Account
1. Go to [Pusher.com](https://pusher.com/)
2. Click **"Sign Up"** (or **"Get Started Free"**)
3. Create an account using your email or GitHub/Google account
4. Verify your email address

### Step 2: Create a Pusher App
1. After logging in, click **"Create app"** on the dashboard
2. Fill in the app details:
   - **App Name**: `restaurant-management` (or any name you prefer)
   - **Cluster**: Select the closest region to your location (e.g., `ap2` for Asia Pacific, `us2` for US East, `eu` for Europe)
   - **Tech Stack**: Select **"Node.js"** for backend and **"React"** for frontend
3. Click **"Create app"**

### Step 3: Get Your Pusher Credentials
After creating the app, you'll see your credentials on the **"App Keys"** tab:
- **app_id**: Your application ID (e.g., `2111064`)
- **key**: Your public key (e.g., `6584dacd7687549268ed`)
- **secret**: Your secret key (e.g., `9ab0a49793cb6f060c9e`)
- **cluster**: Your selected cluster (e.g., `ap2`)

### Step 4: Configure Pusher in Your Application
1. Open `robs-backend-1/.env` file
2. Add or update the following Pusher configuration:

```env
# Pusher Configuration (Optional)
PUSHER_APP_ID=your-app-id-here
PUSHER_KEY=your-pusher-key-here
PUSHER_SECRET=your-pusher-secret-here
PUSHER_CLUSTER=your-cluster-here
```

**Example:**
```env
PUSHER_APP_ID=2111064
PUSHER_KEY=6584dacd7687549268ed
PUSHER_SECRET=9ab0a49793cb6f060c9e
PUSHER_CLUSTER=ap2
```

### Step 5: Install Pusher Package (If Not Already Installed)
If you want to use Pusher, ensure the package is installed:

```bash
cd robs-backend
npm install pusher
```

### Step 6: Restart Your Backend Server
After configuring Pusher, restart your backend server:

```bash
npm run dev
```

### Pusher Dashboard Features
Once configured, you can use the Pusher dashboard to:
- **Debug Console**: Monitor real-time events and messages
- **Connection Stats**: View active connections and usage
- **Event Creator**: Manually trigger test events
- **Logs**: Review event history and errors

### Free Tier Limits
Pusher's free tier includes:
- 200,000 messages per day
- 100 concurrent connections
- Unlimited channels

This is sufficient for development and small-scale deployments.

---

## 6. How to Run

### Development Mode (For testing/making changes)
1.  **Start Backend:**
    In the backend terminal:
    ```bash
    npm run dev
    ```
    *Output should say: `Server running on port 3001`*

2.  **Start Frontend:**
    In the frontend terminal:
    ```bash
    npm run dev
    ```
    *Output will give you a URL, usually `http://localhost:3002`*

3.  **Open in Browser:** Go to the URL shown in the frontend terminal.

### Production Mode (For actual usage)
1.  **Build and Start Backend:**
    ```bash
    npm run build
    npm start
    ```
2.  **Build Frontend:**
    ```bash
    npm run build
    ```
    *(Serve the `dist` folder using a static server like nginx or serve)*

---

## 6. Role-wise Usage & Login

The system comes with pre-configured users (if you ran `npm run db:seed`).

### **Sentinel Login Credentials**
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@restaurant.com` | `password123` |
| **Waiter** | `waiter@restaurant.com` | `password123` |
| **Kitchen** | `kitchen@restaurant.com` | `password123` |

### **1. Admin**
*   **Dashboard:** View daily sales, total orders, and top-selling items.
*   **Menu Management:** Add, edit, or delete menu items. Upload images and set prices.
*   **Staff Management:** Create new user accounts for waiters or kitchen staff.
*   **Reports:** View financial reports and export data.

### **2. Waiter**
*   **Table Selection:** View a map of tables. Green = Free, Red = Occupied.
*   **Taking Orders:** Click a table -> Select items from the menu -> Confirm Order.
*   **Order Status:** See when food is "Ready" to be served.
*   **Billing:** Request bill and mark table as "Paid" to free it up.

### **3. Kitchen**
*   **KDS (Kitchen Display):** See incoming orders instantly.
*   **Process flow:**
    1.  New order arrives (Sound notification).
    2.  Chef clicks "Start Preparing".
    3.  When done, click "Ready" (Notifies Waiter).
    4.  Waiter serves and marks "Served".

---

## 7. Feature Explanation

### Orders
*   **Lifecycle:** `Pending` -> `Preparing` -> `Ready` -> `Served` -> `Paid`.
*   **Real-time:** Updates happen instantly across all devices using Socket.io. No need to refresh the page.

### Tables
*   **Dynamic Status:** Tables change color automatically based on their status.
*   **Reservations:** You can reserve a table for a future time. The system validates availability.

### Billing
*   **Split Bill:** (If supported) functionality to split bills.
*   **Payment Methods:** Cash, Card, UPI.
*   **Receipts:** Generates digital receipts.

---

## 8. Third-Party Libraries & Licenses
*   **React & Vite:** Frontend framework. (MIT License)
*   **Express & Node.js:** Backend server. (MIT License)
*   **Prisma:** Database ORM. (Apache 2.0)
*   **Socket.io:** Real-time communication. (MIT License)
*   **Tailwind CSS:** Styling. (MIT License)
*   **Radix UI:** Accessible UI components. (MIT License)

---

## 9. FAQ / Common Errors

**Q: I get "Connection refused" for the database.**
A: Check your `DATABASE_URL` in `.env`. Ensure PostgreSQL is running and the username/password are correct.

**Q: The frontend says "Network Error" when logging in.**
A: Ensure the Backend is running (`npm run dev`) and the `VITE_API_URL` in frontend `.env` matches the backend port.

**Q: Images are not loading.**
A: Ensure the image URLs in the database are correct/accessible.

**Q: How do I add a new Waiter?**
A: Log in as **Admin**, go to "Users" or "Staff" section, and click "Add User".

---
*Generated for Restaurant Management System.*
