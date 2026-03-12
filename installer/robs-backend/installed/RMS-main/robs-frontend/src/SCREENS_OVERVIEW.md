# Restaurant Order Booking & Billing System - Screens Overview

## 🎨 Design System
- **Colors**: Warm tones (Orange #f97316, Green #10b981, Gray)
- **Typography**: System defaults (Inter/Roboto style)
- **Design**: Clean, modern, material design inspired
- **Responsive**: Mobile-first for staff app, desktop-optimized for admin/kitchen

## 📱 Mobile App Screens (Staff/Waiter) - 8 Screens

### 1. Mobile Login
- **Route**: Mobile → Login
- **Features**:
  - Email/password authentication
  - Role selection (Waiter/Manager)
  - Clean gradient background
  - Demo credentials shown

### 2. Table Selection
- **Route**: Mobile → Tables
- **Features**:
  - Grid view of all tables
  - Real-time status indicators (Free/Occupied/Reserved)
  - Table capacity display
  - Status legend at bottom
  - Color-coded status badges

### 3. Menu Screen
- **Route**: Mobile → Menu (after selecting table)
- **Features**:
  - Category tabs (Pizza, Burgers, Pasta, etc.)
  - Item cards with descriptions & prices
  - Add/remove quantity controls
  - Preparation time indicator
  - Floating cart summary
  - Shopping cart total

### 4. Order Summary
- **Route**: Mobile → Order Review
- **Features**:
  - Editable quantities
  - Special instructions per item
  - Discount application (₹ or %)
  - Tax calculation (5%)
  - Subtotal, discount, tax breakdown
  - Send to kitchen button

### 5. Bill Generation
- **Route**: Mobile → Bill
- **Features**:
  - Itemized bill view
  - Tax and discount breakdown
  - Payment method selection (Cash/Card/UPI)
  - Mark as paid functionality
  - Print/reprint options
  - Order details & timestamp

### 6. Notifications Panel
- **Route**: Mobile → Notifications (bottom nav)
- **Features**:
  - Real-time notifications
  - Order status updates
  - Payment confirmations
  - System alerts
  - Unread badge counter
  - Mark as read functionality

### 7. Profile/Settings
- **Route**: Mobile → Profile (bottom nav)
- **Features**:
  - User information display
  - Notifications toggle
  - Dark mode toggle
  - Help & support links
  - Account settings
  - Logout button

### 8. Order Confirmation
- **Integrated in Order Summary flow**
- **Features**:
  - Order sent confirmation
  - Order number display
  - Return to tables option

## 💻 Web Admin Dashboard - 12 Screens

### 1. Admin Login
- **Route**: Admin → Login
- **Features**:
  - Email/password authentication
  - Admin-only access
  - Gradient background with restaurant branding
  - Demo credentials

### 2. Dashboard Overview
- **Route**: Admin → Dashboard
- **Features**:
  - Key metrics cards (Sales, Orders, Tables, Avg Order Value)
  - Sales trend line chart (7 days)
  - Daily orders bar chart
  - Recent orders table
  - Real-time statistics
  - Occupancy percentage

### 3. Table Management
- **Route**: Admin → Tables
- **Features**:
  - Add/edit/delete tables
  - Table capacity management
  - Status management (Free/Occupied/Reserved)
  - Reservation details
  - Grid view of all tables
  - Quick status change dropdown

### 4. Menu Management
- **Route**: Admin → Menu
- **Features**:
  - CRUD operations for menu items
  - Category management
  - Price editing
  - Availability toggle
  - Preparation time setting
  - Search and filter
  - Bulk actions

### 5. User Management
- **Route**: Admin → Users
- **Features**:
  - Add/edit/delete staff accounts
  - Role assignment (Waiter/Admin/Kitchen)
  - Active/inactive status
  - User profile cards
  - Search functionality
  - Statistics (total users, by role)

### 6. Billing Console
- **Route**: Admin → Billing
- **Features**:
  - Pending payments view
  - Paid bills history
  - Bill detail viewer
  - Mark as paid
  - Print functionality
  - Payment method tracking
  - Order timeline

### 7. Sales Reports
- **Route**: Admin → Reports
- **Features**:
  - Total revenue metrics
  - Sales trend charts
  - Top-selling items table
  - Category distribution pie chart
  - Date range selector
  - Export report functionality
  - Performance indicators

### 8. Tax Summary Report
- **Integrated in Sales Reports**
- **Features**:
  - Gross sales
  - Tax breakdown (5%)
  - Net sales calculation

### 9. Top Selling Items
- **Integrated in Sales Reports**
- **Features**:
  - Ranked list of items
  - Quantity sold
  - Revenue per item
  - Average price
  - Top 3 highlighted

### 10. Settings Panel
- **Route**: Admin → Settings
- **Features**:
  - Restaurant information
  - Tax rate configuration
  - Discount presets management
  - Printer configuration
  - Notification preferences
  - System information

### 11. Reports - Date Filter View
- **Integrated in Reports**
- **Features**:
  - Calendar picker
  - Custom date range
  - Filter by staff
  - Filter by table

### 12. System Settings
- **Integrated in Settings**
- **Features**:
  - Database status
  - Backup information
  - System version
  - Health checks

## 👨‍🍳 Kitchen Display System - 4 Screens

### 1. Kitchen Login
- **Route**: Kitchen → Login
- **Features**:
  - Kitchen staff authentication
  - Green theme branding
  - Chef hat icon
  - Demo credentials

### 2. Kitchen Orders Queue
- **Route**: Kitchen → Display
- **Features**:
  - Real-time order view
  - Filter tabs (All/Pending/In Progress/Ready)
  - Order cards by table
  - Time elapsed indicator
  - Delayed order warnings (red highlight)
  - Auto-refresh indicator

### 3. Order Detail Cards
- **Integrated in Kitchen Display**
- **Features**:
  - Itemized view per order
  - Quantity and item name
  - Special instructions highlighted
  - Status per item (Pending/Cooking/Ready)
  - Action buttons (Start Cooking/Mark Ready)
  - Table number and order ID

### 4. Item Status Management
- **Integrated in Kitchen Display**
- **Features**:
  - Individual item tracking
  - Status progression (Pending → In Progress → Ready)
  - Visual status badges
  - One-click status updates
  - Completion indicators

## 🎯 User Journey Examples

### Journey 1: Waiter Taking Order → Kitchen → Payment
1. **Waiter Login** → Mobile Login
2. **Select Table** → Table Selection (tap Table 5)
3. **Browse Menu** → Menu Screen (add items)
4. **Review Order** → Order Summary (add discount if needed)
5. **Send to Kitchen** → Order sent notification
6. **Kitchen Receives** → Kitchen Display shows new order
7. **Kitchen Prepares** → Items marked as in-progress, then ready
8. **Waiter Serves** → Returns to bill screen
9. **Generate Bill** → Bill Screen with total
10. **Receive Payment** → Mark as paid (Cash/Card/UPI)
11. **Print Receipt** → Bill printed

### Journey 2: Admin Managing Restaurant
1. **Admin Login** → Admin Dashboard
2. **View Dashboard** → Check today's stats
3. **Manage Tables** → Add new table or update reservation
4. **Update Menu** → Change prices, add new items
5. **Check Reports** → View sales trends
6. **Manage Settings** → Update tax rate or discount presets

### Journey 3: Kitchen Staff Managing Orders
1. **Kitchen Login** → Kitchen Display
2. **View Pending Orders** → See all new orders
3. **Start Cooking** → Mark items as in-progress
4. **Complete Items** → Mark items as ready
5. **Monitor Delays** → See delayed orders highlighted

## 🔄 Real-time Features (Simulated)
- Order status updates
- Kitchen display auto-refresh
- Notification system
- Table status changes
- Live sales metrics

## 🎨 Optional Phase 2 Features (UI Prepared)
- QR-based customer ordering (framework ready)
- Loyalty points dashboard (can be added)
- Inventory view (data structure ready)

## 📊 Technology Stack
- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v3
- **Components**: Shadcn UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## 🎯 Key Design Principles
1. **Minimal Cognitive Load**: Clear labels, intuitive flows
2. **Touch-Friendly**: Large buttons for mobile
3. **Visual Hierarchy**: Color-coded status, clear typography
4. **Responsive**: Mobile-first for staff, desktop for admin
5. **Feedback**: Toast notifications for all actions
6. **Accessibility**: High contrast, readable text sizes
