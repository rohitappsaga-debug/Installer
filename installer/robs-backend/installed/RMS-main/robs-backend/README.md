# Restaurant Order Booking System - Backend API

A comprehensive backend API for restaurant order management built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Table Management**: Real-time table status tracking
- **Menu Management**: Complete CRUD operations for menu items
- **Order Processing**: Full order lifecycle management
- **Kitchen Integration**: Real-time order updates for kitchen staff
- **Billing System**: Payment tracking and bill generation
- **Reporting**: Sales analytics and performance metrics
- **Real-time Updates**: WebSocket integration for live updates
- **Database Migrations**: Prisma-based schema management

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12.0 or higher (The Web Installer can attempt to install this for you)
- npm or yarn package manager

## 🚀 Quick Start (Web Installer)

The easiest way to set up the application is using our **Web-Based Installer**.

1.  **Open Terminal as Administrator**:
    *   **Windows**: Right-click Command Prompt or PowerShell and select **"Run as Administrator"**.
2.  **Start the Installer**:
    ```bash
    # Navigate to the project ROOT directory
    cd ..
    
    # Run the automated installer script
    npm run installer
    ```
3.  **Open the Installer UI**:
    Navigate to `http://localhost:3005` in your browser.
4.  **Follow the Wizard**:
    The installer will guide you through system requirements, database setup, and application configuration.

Once finished, the system will automatically transition to application mode at `http://localhost:3000`.

---

## 🔧 Manual Installation


1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3002
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 📊 Database Schema

The application uses the following main entities:

- **Users**: Staff members with different roles (waiter, admin, kitchen)
- **Tables**: Restaurant tables with status tracking
- **MenuItems**: Food and beverage items
- **Orders**: Customer orders with items
- **OrderItems**: Individual items within orders
- **Notifications**: System notifications
- **Settings**: Restaurant configuration
- **DailySales**: Sales reporting data

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Toggle user status

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table by ID
- `POST /api/tables` - Create table (Admin)
- `PUT /api/tables/:id` - Update table (Admin)
- `DELETE /api/tables/:id` - Delete table (Admin)
- `PATCH /api/tables/:id/status` - Update table status

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `GET /api/menu/categories/list` - Get all categories
- `POST /api/menu` - Create menu item (Admin)
- `PUT /api/menu/:id` - Update menu item (Admin)
- `DELETE /api/menu/:id` - Delete menu item (Admin)
- `PATCH /api/menu/:id/availability` - Toggle availability (Admin)

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders/table/:tableNumber` - Get orders by table
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `PATCH /api/orders/:id/status` - Update order status

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/:id` - Get notification by ID
- `POST /api/notifications` - Create notification (Admin)
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Settings (Admin only)
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/tax` - Get tax configuration
- `PATCH /api/settings/tax` - Update tax rate

### Reports (Admin only)
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/range` - Date range sales report
- `GET /api/reports/top-items` - Top selling items
- `GET /api/reports/summary` - Sales summary

## 🔐 Authentication

The API uses JWT-based authentication with role-based access control:

### User Roles
- **waiter**: Can manage tables, orders, and billing
- **admin**: Full access to all endpoints
- **kitchen**: Can view orders and update item status

### Authentication Flow
1. Login with email/password
2. Receive JWT access token and refresh token
3. Include access token in Authorization header: `Bearer <token>`
4. Use refresh token to get new access token when expired

## 🔄 Real-time Features

The API includes WebSocket support for real-time updates:

### Socket Events
- `order:created` - New order created
- `order:updated` - Order updated
- `order:status-changed` - Order status changed
- `table:status-changed` - Table status changed
- `notification:new` - New notification
- `kitchen:item-ready` - Kitchen item ready

### Socket Rooms
- `waiter` - Waiter-specific updates
- `admin` - Admin-specific updates
- `kitchen` - Kitchen-specific updates
- `table-{number}` - Table-specific updates

## 📝 Database Migrations

The application uses Prisma for database management:

```bash
# Create a new migration
npm run db:migrate

# Reset database (WARNING: This will delete all data)
npm run db:reset

# Push schema changes without migration
npm run db:push

# Open Prisma Studio (Database GUI)
npm run db:studio
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring

### Health Check
- `GET /health` - Server health status

### Logging
- Application logs are stored in `logs/` directory
- Different log levels: error, warn, info, http, debug
- Structured logging with Winston

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=your-frontend-url
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔧 Development

### Project Structure
```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Code Style
- TypeScript strict mode enabled
- ESLint configuration
- Prettier formatting
- Consistent naming conventions

## 📚 API Documentation

### Request/Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Format
```json
{
  "success": false,
  "error": "Error message",
  "stack": "Error stack trace (development only)"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the database schema

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete CRUD operations for all entities
- Authentication and authorization
- Real-time updates
- Reporting and analytics
- Database migrations
