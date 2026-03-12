import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true, abortEarly: false });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new AppError(errorMessage, 400));
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { stripUnknown: true, abortEarly: false });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new AppError(errorMessage, 400));
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, { stripUnknown: true, abortEarly: false });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      next(new AppError(errorMessage, 400));
      return;
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // User schemas
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('waiter', 'admin', 'kitchen', 'manager', 'delivery').required(),
    active: Joi.boolean(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    role: Joi.string().valid('waiter', 'admin', 'kitchen', 'manager', 'delivery'),
    active: Joi.boolean(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid('waiter', 'kitchen', 'admin', 'manager', 'delivery').required()
  }).unknown(true),

  // Table schemas
  createTable: Joi.object({
    number: Joi.number().integer().min(1).required(),
    capacity: Joi.number().integer().min(1).max(20).required(),
    status: Joi.string().valid('free', 'occupied', 'reserved'),
  }),

  bulkCreateTable: Joi.object({
    tables: Joi.array().items(Joi.object({
      number: Joi.number().integer().min(1).required(),
      capacity: Joi.number().integer().min(1).max(20).required(),
      status: Joi.string().valid('free', 'occupied', 'reserved'),
    })).min(1).required(),
  }),

  updateTable: Joi.object({
    number: Joi.number().integer().min(1),
    capacity: Joi.number().integer().min(1).max(20),
    status: Joi.string().valid('free', 'occupied', 'reserved'),
    reservedBy: Joi.string().max(100).allow('', null),
    reservedTime: Joi.alternatives().try(
      Joi.date().iso(),
      Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    ).allow(null),
    currentOrderId: Joi.string().allow(null),
  }),

  // Menu item schemas
  createMenuItem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    category: Joi.string().min(2).max(50),
    categoryId: Joi.string().uuid(),
    price: Joi.number().min(0).required(),
    description: Joi.string().max(500).allow('', null),
    imageUrl: Joi.string().uri().allow('', null),
    available: Joi.boolean(),
    preparationTime: Joi.number().integer().min(0).max(120),
    isVeg: Joi.boolean(),
    availableFrom: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
    availableTo: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
    availabilityReason: Joi.string().max(200).allow('', null),
  }).or('category', 'categoryId'),

  updateMenuItem: Joi.object({
    name: Joi.string().min(2).max(100),
    category: Joi.string().min(2).max(50),
    categoryId: Joi.string().uuid(),
    price: Joi.number().min(0),
    description: Joi.string().max(500).allow('', null),
    imageUrl: Joi.string().uri().allow('', null),
    available: Joi.boolean(),
    preparationTime: Joi.number().integer().min(0).max(120),
    isVeg: Joi.boolean(),
    availableFrom: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
    availableTo: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('', null),
    availabilityReason: Joi.string().max(200).allow('', null),
  }),

  createModifier: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    price: Joi.number().min(0).required(),
    available: Joi.boolean(),
  }),

  // Order schemas
  createOrder: Joi.object({
    tableNumber: Joi.number().integer().min(1).allow(null),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        notes: Joi.string().max(200).allow('', null).empty(''),
        modifiers: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required()
          })
        ).allow(null),
      })
    ).min(1).required(),
    discountType: Joi.string().valid('percentage', 'amount').allow(null),
    discountValue: Joi.number().min(0).allow(null),
    deliveryDetails: Joi.object({
      customerName: Joi.string().required(),
      customerPhone: Joi.string().required(),
      address: Joi.string().required(),
    }).allow(null),
  }).or('tableNumber', 'deliveryDetails'),

  updateOrder: Joi.object({
    status: Joi.string().valid('pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'),
    discountType: Joi.string().valid('percentage', 'amount'),
    discountValue: Joi.number().min(0).when('discountType', {
      is: 'percentage',
      then: Joi.number().max(100)
    }),
    isPaid: Joi.boolean(),
    paymentMethod: Joi.string().valid('cash', 'card', 'upi'),
    holdStatus: Joi.boolean(),
    cancelReason: Joi.string().allow(null, ''),
  }),

  addOrderItems: Joi.object({
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        notes: Joi.string().max(200).allow('', null).empty(''),
      })
    ).min(1).required(),
  }),

  createOrderItem: Joi.object({
    menuItemId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    notes: Joi.string().max(200).allow('', null).empty(''),
  }),

  updateOrderItem: Joi.object({
    quantity: Joi.number().integer().min(1),
    notes: Joi.string().max(200).allow('', null).empty(''),
    status: Joi.string().valid('pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'),
  }),

  payOrder: Joi.object({
    amount: Joi.number().min(0.01).required(),
    method: Joi.string().valid('cash', 'card', 'upi').required(),
    transactionId: Joi.string().allow(null, ''),
  }),

  refundTransaction: Joi.object({
    reason: Joi.string().max(200),
  }),

  bulkTable: Joi.object({
    tables: Joi.array().items(
      Joi.object({
        number: Joi.number().integer().min(1).required(),
        capacity: Joi.number().integer().min(1).max(20).required(),
        status: Joi.string().valid('free', 'occupied', 'reserved'),
      })
    ).min(1).required(),
  }),

  groupTables: Joi.object({
    tableNumbers: Joi.array().items(Joi.number().integer().min(1)).min(2).required(),
    primaryTableNumber: Joi.number().integer().min(1).required(),
  }),

  ungroupTables: Joi.object({
    groupId: Joi.string().required(),
  }),

  splitOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    ).min(1).required(),
    targetTableNumber: Joi.number().integer().min(1).required(),
  }),

  mergeOrder: Joi.object({
    sourceTableNumber: Joi.number().integer().min(1).required(),
    targetTableNumber: Joi.number().integer().min(1).required(),
  }),

  holdOrder: Joi.object({
    hold: Joi.boolean().required(),
  }),

  mergeTables: Joi.object({
    sourceTableNumber: Joi.number().integer().min(1).required(),
    targetTableNumber: Joi.number().integer().min(1).required(),
  }),

  assignDriver: Joi.object({
    driverId: Joi.string().uuid().required(),
  }),

  // Inventory schemas
  createIngredient: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    unit: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    minLevel: Joi.number().min(0).default(0),
  }),

  updateIngredient: Joi.object({
    name: Joi.string().min(2).max(100),
    unit: Joi.string(),
    stock: Joi.number().min(0),
    minLevel: Joi.number().min(0),
  }),

  adjustStock: Joi.object({
    quantity: Joi.number().required(),
    type: Joi.string().valid('restock', 'wastage', 'correction').required(),
    reason: Joi.string().max(200).allow(null, ''),
  }),

  createRecipe: Joi.object({
    menuItemId: Joi.string().uuid().required(),
    ingredientId: Joi.string().uuid().required(),
    quantity: Joi.number().min(0).required(),
  }),

  // Notification schemas
  createNotification: Joi.object({
    type: Joi.string().valid('order', 'payment', 'alert').required(),
    message: Joi.string().min(1).max(500).required(),
    userId: Joi.string().required(),
  }),

  // Settings schemas
  updateSettings: Joi.object({
    taxRate: Joi.number().min(0).max(100),
    taxEnabled: Joi.boolean(),
    currency: Joi.string().min(1).max(10),
    restaurantName: Joi.string().min(1).max(100),
    discountPresets: Joi.array().items(Joi.number().min(0).max(100)),
    printerConfig: Joi.object({
      enabled: Joi.boolean(),
      printerName: Joi.string().max(100),
    }),
    restaurantAddress: Joi.string().allow(null, ''),
    gstNo: Joi.string().allow(null, ''),
    enabledPaymentMethods: Joi.array().items(Joi.string()),
    receiptFooter: Joi.string().allow(null, ''),
    businessHours: Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    }),
    notificationPreferences: Joi.object({
      orderNotifications: Joi.boolean(),
      paymentNotifications: Joi.boolean(),
      lowStockAlerts: Joi.boolean(),
    }).unknown(true),
  }),

  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    description: Joi.string().allow(null, ''),
    isActive: Joi.boolean(),
  }),

  bulkCreateCategory: Joi.object({
    categories: Joi.array().items(Joi.object({
      name: Joi.string().min(2).max(50).required(),
      description: Joi.string().allow(null, ''),
      isActive: Joi.boolean(),
    })).min(1).required(),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(2).max(50),
    description: Joi.string().allow(null, ''),
    isActive: Joi.boolean(),
  }),

  // Reservation schemas
  createReservation: Joi.object({
    tableNumber: Joi.number().integer().min(1).required(),
    customerName: Joi.string().min(2).max(100).required(),
    customerPhone: Joi.string().allow('', null),
    date: Joi.date().iso().required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  }),

  updateReservation: Joi.object({
    customerName: Joi.string().min(2).max(100),
    customerPhone: Joi.string().allow('', null),
    status: Joi.string().valid('pending', 'checked_in', 'cancelled', 'expired'),
  }),

  reservationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    tableNumber: Joi.number().integer().min(1),
    status: Joi.string().valid('pending', 'checked_in', 'cancelled', 'expired'),
    date: Joi.date().iso(),
  }),

  // Query schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  usersQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid('waiter', 'admin', 'kitchen', 'manager', 'delivery'),
    active: Joi.boolean(),
  }),

  orderQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'preparing', 'ready', 'served', 'delivered', 'cancelled'),
    tableNumber: Joi.number().integer().min(1),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
  }),

  menuQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    category: Joi.string().max(50),
    available: Joi.boolean(),
    search: Joi.string().max(100),
  }),

  tableQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('free', 'occupied', 'reserved'),
  }),

  notificationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    type: Joi.string().valid('order', 'payment', 'alert'),
    read: Joi.boolean(),
  }),

  // Params schemas
  uuidParam: Joi.object({
    id: Joi.string().required(),
  }),

  tableNumberParam: Joi.object({
    tableNumber: Joi.number().integer().min(1).required(),
  }),

  orderItemParams: Joi.object({
    id: Joi.string().required(),
    itemId: Joi.string().required(),
  }),

  updateItemStatus: Joi.object({
    status: Joi.string().valid('pending', 'preparing', 'ready', 'served', 'cancelled').required(),
  }),

  // Supplier schemas
  createSupplier: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    contactName: Joi.string().max(100).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().max(20).allow(null, ''),
    address: Joi.string().max(200).allow(null, ''),
  }),

  updateSupplier: Joi.object({
    name: Joi.string().min(2).max(100),
    contactName: Joi.string().max(100).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    phone: Joi.string().max(20).allow(null, ''),
    address: Joi.string().max(200).allow(null, ''),
  }),

  // Purchase Order schemas
  createPO: Joi.object({
    supplierId: Joi.string().required(),
    items: Joi.array().items(Joi.object({
      ingredientId: Joi.string().required(),
      quantity: Joi.number().min(0.001).required(),
      unitCost: Joi.number().min(0).required(),
    })).min(1).required(),
  }),
};
