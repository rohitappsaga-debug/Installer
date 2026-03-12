# Restaurant Management System

A comprehensive, production-ready restaurant management system built with modern web technologies. This system provides complete solutions for order management, table reservations, kitchen operations, inventory tracking, and financial reporting.

## 🌟 Features

### Core Functionality
- **Multi-Role Access Control**: Admin, Waiter, Kitchen, Manager, and Delivery roles with specific permissions
- **Real-time Order Management**: Live order status updates using Socket.io
- **Table Management**: Dynamic table status tracking (free, occupied, reserved)
- **Smart Reservation System**: Automated reservation handling with grace period expiration
- **Kitchen Display System**: Dedicated interface for kitchen staff to manage order preparation
- **Inventory Management**: Track ingredients, suppliers, and purchase orders
- **Financial Reporting**: Daily sales summaries, revenue tracking, and KPI dashboards
- **Payment Processing**: Support for multiple payment methods (Cash, Card, UPI)

### Advanced Features
- **Order Lifecycle Management**: Complete order flow from pending → preparing → ready → served → delivered
- **Recipe Mapping**: Link menu items to ingredients for inventory tracking
- **Activity Logging**: Comprehensive audit trail of all system actions
- **Notification System**: Real-time alerts for orders, payments, and system events
- **Discount Management**: Flexible discount system with preset options
- **Mobile-First Design**: Responsive UI optimized for tablets and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing

### Security & Quality
- **Role-Based Access Control (RBAC)** - Secure permission system
- **Joi Validation** - Input validation and sanitization
- **Environment-based Configuration** - Secure credential management
- **Swagger/OpenAPI** - API documentation

## 📋 Prerequisites

Before installation, ensure you have:
- **Node.js** (v18.0.0 or higher) - Required for backend
- **PostgreSQL** (v13 or higher)
- **npm** (v9 or higher) or **yarn**

## 🚀 Quick Start (Web Installer)

The easiest way to set up the application is using our **Web-Based Installer**.

1.  **Open Terminal as Administrator**:
    *   **Windows**: Right-click Command Prompt or PowerShell and select **"Run as Administrator"**.
    *   **Mac/Linux**: Use `sudo` if necessary for global operations.
2.  **Start the Installer**:
    ```bash
    # Navigate to the project root directory
    cd restaurant-management-system
    
    # Run the automated installer script
    npm run installer
    ```
3.  **Open the Installer UI**:
    Navigate to `http://localhost:3005` in your browser.
4.  **Follow the Wizard**:
    The installer will guide you through system requirements, database setup, and application configuration.

Once finished, the system will automatically transition to application mode.

## 🚀 Manual Installation

### Step 1: Clone or Extract the Project
```bash
# If from Git
git clone <repository-url>
cd restaurant-management-system

# If from downloaded archive
# Extract the ZIP file and navigate to the folder
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd robs-backend

# Install dependencies
npm install

# Create environment file
# Mac/Linux:
cp .env.example .env
# Windows:
copy .env.example .env

# Edit .env file
# Ensure DATABASE_URL is correct for your local PostgreSQL setup
# For production, generate a strong JWT_SECRET!

```

### Step 3: Setup Database

```bash
# Create the database
# Option A: Using psql command line
psql -U postgres -c "CREATE DATABASE restaurant_db;"

# Option B: Using pgAdmin or your preferred PostgreSQL client
# Create a new database named "restaurant_db"

# Import demo database with sample data
psql -U postgres -d restaurant_db -f ../database/demo_database.sql

# Or run Prisma migrations (if not using demo database)
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 4: Setup Frontend

```bash
# Navigate to frontend directory (from project root)
cd robs-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# The default configuration should work for local development
# The default configuration should work for local development
# VITE_API_URL=http://localhost:3000
```

### Step 5: Run the Application

**Terminal 1 - Backend:**
```bash
cd robs-backend
npm run dev
```
The backend will start on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd robs-frontend
npm run dev
```
The frontend will start on `http://localhost:3002`

### Step 6: Access the Application

Open your browser and navigate to `http://localhost:3002`

## 🔐 Demo Credentials

The demo database includes the following test accounts:

### Admin Account
- **Email**: `admin@restaurant.com`
- **Password**: `admin123`
- **Access**: Full system control, user management, reports, settings

### Waiter Account
- **Email**: `waiter@restaurant.com`
- **Password**: `waiter123`
- **Access**: Order creation, table management, order status updates

### Kitchen Account
- **Email**: `kitchen@restaurant.com`
- **Password**: `kitchen123`
- **Access**: View orders, update preparation status

### Manager Account
- **Email**: `manager@restaurant.com`
- **Password**: `manager123`
- **Access**: Reports, analytics, order oversight

## 📚 Documentation

For detailed documentation, please refer to:
- **[Full Documentation](documentation/README.md)** - Complete system documentation
- **[API Documentation](documentation/API_DOCUMENTATION.md)** - REST API endpoints
- **[User Guide](documentation/USER_GUIDE.md)** - How to use the system
- **[Deployment Guide](documentation/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## 🏗️ Project Structure

```
restaurant-management-system/
├── robs-backend/            # Backend application
│   ├── src/                 # Source code
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── prisma/              # Database schema and migrations
│   └── .env.example         # Environment variables template
├── robs-frontend/           # Frontend application
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utility libraries
│   └── .env.example         # Environment variables template
├── database/                # Database files
│   └── demo_database.sql    # Sample database with demo data
├── documentation/           # Project documentation
├── screenshots/             # Application screenshots
└── README.md               # This file
```

## 🎯 Key Differentiators

### Not a Template - Real Business Logic
This is **not** a reskinned template. It implements deep restaurant business logic:

- **Advanced Order Lifecycle**: Real-time status synchronization between Waiters and Kitchen
- **Smart Table Management**: Automatic status updates based on order and reservation states
- **Automated Reservation System**: Background process that handles reservation timing and expiration
- **Recipe-Based Inventory**: Menu items linked to ingredients for stock tracking
- **Multi-Role Permissions**: Each role has carefully designed access restrictions
- **Financial KPIs**: Complex metrics calculation for business analysis

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
- `DATABASE_URL`: Connection string for PostgreSQL database
- `JWT_SECRET`: Secret key for signing authentication tokens (min 32 chars in production)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (`development`, `production`, `test`)
- `CORS_ORIGIN`: Allowed frontend origin URL
- `SOCKET_CORS_ORIGIN`: Allowed WebSocket origin URL

See `.env.example` in `robs-backend` for a complete list of all supported variables.

**Frontend (.env)**:
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in backend .env file
- Ensure database "restaurant_db" exists

### Frontend Cannot Connect to Backend
- Verify backend is running on port 3000
- Check VITE_API_URL in frontend .env file
- Ensure CORS_ORIGIN in backend .env matches frontend URL

### Port Already in Use
- Backend: Change PORT in backend .env file
- Frontend: Vite will automatically suggest an alternative port

## 📝 License

This project is licensed for commercial use. See [LICENSING_SUMMARY.md](documentation/LICENSING_SUMMARY.md) for details.

## 🤝 Support

For support and questions:
- Check the [documentation](documentation/README.md)
- Review the [API documentation](documentation/API_DOCUMENTATION.md)
- Contact support (add your support email here)

## 🎉 Getting Started

1. Follow the installation steps above
2. Login with demo credentials
3. Explore the different role-based interfaces
4. Check out the sample menu, orders, and reports
5. Customize for your restaurant's needs

---

**Built with ❤️ for the restaurant industry**
