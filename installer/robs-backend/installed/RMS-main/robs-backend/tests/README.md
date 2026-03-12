# Restaurant Order Booking System - API Tests

This directory contains comprehensive unit tests for all API endpoints in the Restaurant Order Booking System.

## Test Structure

```
tests/
├── setup.ts           # Test database setup and configuration
├── utils.ts           # Test utilities and helper functions
├── auth.test.ts       # Authentication API tests
├── tables.test.ts     # Tables management API tests
├── menu.test.ts       # Menu items API tests
├── orders.test.ts     # Orders management API tests
└── users.test.ts      # User management API tests
```

## Test Coverage

### Authentication API (`/api/auth`)
- ✅ User login with valid/invalid credentials
- ✅ Token refresh functionality
- ✅ Get current user information
- ✅ JWT token validation and expiration
- ✅ Password validation and user status checks

### Tables API (`/api/tables`)
- ✅ Get all tables with pagination and filtering
- ✅ Get table by ID
- ✅ Create new table (Admin only)
- ✅ Update table information (Admin only)
- ✅ Delete table (Admin only)
- ✅ Update table status
- ✅ Role-based access control

### Menu API (`/api/menu`)
- ✅ Get all menu items with filtering and search
- ✅ Get menu item by ID
- ✅ Create new menu item (Admin only)
- ✅ Update menu item (Admin only)
- ✅ Delete menu item (Admin only)
- ✅ Category and availability filtering

### Orders API (`/api/orders`)
- ✅ Get all orders with filtering
- ✅ Get order by ID with items
- ✅ Create new order (Waiter/Admin)
- ✅ Update order status (Kitchen/Admin)
- ✅ Delete order (Admin only)
- ✅ Order item management

### Users API (`/api/users`)
- ✅ Get all users with filtering (Admin only)
- ✅ Get user by ID
- ✅ Create new user (Admin only)
- ✅ Update user information
- ✅ Delete user (Admin only)
- ✅ Role-based permissions

## Running Tests

### Prerequisites
- PostgreSQL database running
- Test database created: `restaurant_test_db`
- Environment variables configured

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci

# Run specific test suites
npm run test:auth
npm run test:tables
npm run test:menu
npm run test:orders
npm run test:users
```

### Test Database Setup

The tests use a separate test database (`restaurant_test_db`) to avoid affecting development data.

**Test Database Configuration:**
- Database: `restaurant_test_db`
- Host: `localhost:5432`
- User: `postgres`
- Password: `password`

## Test Features

### 🔐 Authentication Testing
- JWT token generation and validation
- Role-based access control
- Password hashing verification
- Token expiration handling

### 🗃️ Database Testing
- Automatic test data cleanup
- Database schema validation
- Transaction rollback testing
- Data integrity checks

### 🛡️ Security Testing
- Input validation testing
- SQL injection prevention
- Authorization boundary testing
- Error handling validation

### 📊 API Testing
- HTTP status code validation
- Response format verification
- Request/response schema validation
- Error message consistency

## Test Utilities

### TestUtils Class
Provides helper methods for:
- Creating test users with different roles
- Generating JWT tokens
- Creating test data (tables, menu items, orders)
- Making authenticated requests

### Database Setup
- Automatic database reset before tests
- Test data seeding
- Cleanup after each test
- Connection management

## Coverage Reports

Test coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/lcov-report/index.html`
- LCOV report: `coverage/lcov.info`
- Text summary in terminal

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Test data is automatically cleaned up
3. **Realistic Data**: Tests use realistic test data
4. **Error Cases**: Both success and failure scenarios are tested
5. **Security**: Authentication and authorization are thoroughly tested

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify test database exists

2. **Port Conflicts**
   - Ensure no other services are using test ports
   - Check for running development servers

3. **Test Failures**
   - Check test database state
   - Verify environment variables
   - Review test logs for specific errors

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose
```

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use TestUtils for common operations
3. Test both success and failure cases
4. Include proper cleanup
5. Add appropriate assertions
6. Update this README if needed

