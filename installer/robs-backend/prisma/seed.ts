import 'dotenv/config';
import { PrismaClient, UserRole, TableStatus, OrderStatus, PaymentMethod, NotificationType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@restaurant.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@restaurant.com',
        password: hashedPassword,
        role: UserRole.admin,
        active: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'waiter@restaurant.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'waiter@restaurant.com',
        password: hashedPassword,
        role: UserRole.waiter,
        active: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'kitchen@restaurant.com' },
      update: {},
      create: {
        name: 'Mike Johnson',
        email: 'kitchen@restaurant.com',
        password: hashedPassword,
        role: UserRole.kitchen,
        active: true,
      },
    }),
  ]);

  console.log('✅ Users created:', users.length);

  // Create tables
  const tables = await Promise.all([
    prisma.table.upsert({
      where: { number: 1 },
      update: {},
      create: {
        number: 1,
        capacity: 2,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 2 },
      update: {},
      create: {
        number: 2,
        capacity: 4,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 3 },
      update: {},
      create: {
        number: 3,
        capacity: 4,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 4 },
      update: {},
      create: {
        number: 4,
        capacity: 6,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 5 },
      update: {},
      create: {
        number: 5,
        capacity: 2,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 6 },
      update: {},
      create: {
        number: 6,
        capacity: 4,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 7 },
      update: {},
      create: {
        number: 7,
        capacity: 8,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 8 },
      update: {},
      create: {
        number: 8,
        capacity: 2,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 9 },
      update: {},
      create: {
        number: 9,
        capacity: 4,
        status: TableStatus.free,
      },
    }),
    prisma.table.upsert({
      where: { number: 10 },
      update: {},
      create: {
        number: 10,
        capacity: 6,
        status: TableStatus.free,
      },
    }),
  ]);

  console.log('✅ Tables created:', tables.length);

  // Create menu items
  const menuItems = await Promise.all([
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Margherita Pizza',
        category: 'Pizza',
        price: 299,
        description: 'Classic tomato and mozzarella',
        available: true,
        preparationTime: 15,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Pepperoni Pizza',
        category: 'Pizza',
        price: 399,
        description: 'Loaded with pepperoni',
        available: true,
        preparationTime: 15,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Caesar Salad',
        category: 'Salads',
        price: 199,
        description: 'Fresh romaine lettuce with Caesar dressing',
        available: true,
        preparationTime: 10,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Chicken Burger',
        category: 'Burgers',
        price: 249,
        description: 'Grilled chicken with special sauce',
        available: true,
        preparationTime: 12,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Veg Burger',
        category: 'Burgers',
        price: 199,
        description: 'Veggie patty with fresh vegetables',
        available: true,
        preparationTime: 10,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440005' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Pasta Carbonara',
        category: 'Pasta',
        price: 349,
        description: 'Creamy pasta with bacon',
        available: true,
        preparationTime: 18,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440006' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Grilled Chicken',
        category: 'Mains',
        price: 449,
        description: 'Tender grilled chicken with herbs',
        available: true,
        preparationTime: 20,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440007' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Fish & Chips',
        category: 'Mains',
        price: 399,
        description: 'Crispy fried fish with fries',
        available: true,
        preparationTime: 15,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440008' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'Chocolate Brownie',
        category: 'Desserts',
        price: 149,
        description: 'Warm chocolate brownie with ice cream',
        available: true,
        preparationTime: 8,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440009' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'Tiramisu',
        category: 'Desserts',
        price: 199,
        description: 'Classic Italian dessert',
        available: true,
        preparationTime: 5,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440010' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        name: 'Coke',
        category: 'Beverages',
        price: 49,
        description: 'Chilled soft drink',
        available: true,
        preparationTime: 2,
      },
    }),
    prisma.menuItem.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440011' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        name: 'Fresh Orange Juice',
        category: 'Beverages',
        price: 99,
        description: 'Freshly squeezed orange juice',
        available: true,
        preparationTime: 5,
      },
    }),
  ]);

  console.log('✅ Menu items created:', menuItems.length);

  // Create settings
  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      taxRate: 5.00,
      currency: '₹',
      restaurantName: 'The Golden Fork',
      discountPresets: [5, 10, 15, 20],
      printerConfig: {
        enabled: true,
        printerName: 'Kitchen Printer 1',
      },
    },
  });

  console.log('✅ Settings created');

  // Create sample notifications only if none exist
  const existingNotificationsCount = await prisma.notification.count();
  let notifications: any[] = [];

  if (existingNotificationsCount === 0) {
    notifications = await Promise.all([
      prisma.notification.create({
        data: {
          type: NotificationType.order,
          message: 'Welcome to the restaurant management system!',
          userId: users[0].id,
          read: false,
        },
      }),
      prisma.notification.create({
        data: {
          type: NotificationType.alert,
          message: 'System initialized successfully',
          userId: users[0].id,
          read: true,
        },
      }),
    ]);
    console.log('✅ Notifications created:', notifications.length);
  } else {
    console.log('ℹ️ Notifications already exist, skipping creation.');
  }

  // Create sample daily sales data
  const today = new Date();
  const dailySales = await Promise.all([
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        totalSales: 12890,
        totalOrders: 35,
        averageOrderValue: 368,
      },
    }),
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        totalSales: 13240,
        totalOrders: 36,
        averageOrderValue: 368,
      },
    }),
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        totalSales: 14560,
        totalOrders: 39,
        averageOrderValue: 373,
      },
    }),
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        totalSales: 16890,
        totalOrders: 48,
        averageOrderValue: 352,
      },
    }),
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        totalSales: 18230,
        totalOrders: 51,
        averageOrderValue: 357,
      },
    }),
    prisma.dailySales.upsert({
      where: { date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) },
      update: {},
      create: {
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        totalSales: 15420,
        totalOrders: 42,
        averageOrderValue: 367,
      },
    }),
  ]);

  console.log('✅ Daily sales data created:', dailySales.length);

  // --- Historical Orders and Payments ---
  console.log('📦 Generating individual historical orders and payments...');

  const waiterId = users.find(u => u.role === UserRole.waiter)?.id || users[0].id;
  const adminId = users.find(u => u.role === UserRole.admin)?.id || users[0].id;

  // Helper to get random menu items
  const getRandomMenuItems = (count: number) => {
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Generate 20 historical orders for the last few days
  for (let i = 0; i < 20; i++) {
    const tableNum = Math.floor(Math.random() * 10) + 1;
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 7));
    orderDate.setHours(12 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

    const selectedItems = getRandomMenuItems(Math.floor(Math.random() * 3) + 2);
    const subtotal = selectedItems.reduce((acc, item) => acc + Number(item.price), 0);
    const tax = Math.round((subtotal * 0.05) * 100) / 100;
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        tableNumber: tableNum,
        status: OrderStatus.served,
        createdBy: Math.random() > 0.5 ? waiterId : adminId,
        total: total,
        isPaid: true,
        paymentMethod: i % 3 === 0 ? PaymentMethod.cash : (i % 3 === 1 ? PaymentMethod.card : PaymentMethod.upi),
        createdAt: orderDate,
        updatedAt: orderDate,
        orderItems: {
          create: selectedItems.map(item => ({
            menuItemId: item.id,
            quantity: 1,
            status: OrderStatus.served,
            createdAt: orderDate,
            updatedAt: orderDate
          }))
        }
      }
    });

    await prisma.payment_transactions.create({
      data: {
        orderId: order.id,
        amount: total,
        method: order.paymentMethod as PaymentMethod,
        status: 'completed',
        createdAt: orderDate
      }
    });
  }

  console.log('✅ Historical orders and payments created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- Users: ${users.length}`);
  console.log(`- Tables: ${tables.length}`);
  console.log(`- Menu Items: ${menuItems.length}`);
  console.log(`- Settings: 1`);
  console.log(`- Notifications: ${notifications.length}`);
  console.log(`- Daily Sales: ${dailySales.length}`);

  console.log('\n🔑 Default Login Credentials:');
  console.log('Admin: admin@restaurant.com / password123');
  console.log('Waiter: waiter@restaurant.com / password123');
  console.log('Kitchen: kitchen@restaurant.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
