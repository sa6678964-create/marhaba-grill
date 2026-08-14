// lib/validation.js
// Input validation schemas using Zod for type-safe schema validation

const { z } = require('zod');

// Order item schema
const OrderItemSchema = z.object({
  menu_item_id: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name is required').max(255),
  unit_price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  options: z.record(z.any()).optional().nullable()
});

// Customer info schema
const CustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
});

// Address schema
const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(100),
  apartment: z.string().optional().nullable()
});

// Create order request schema
const CreateOrderSchema = z.object({
  cart: z.array(OrderItemSchema).min(1, 'Cart cannot be empty'),
  customer: CustomerSchema,
  address: AddressSchema,
  payment_method: z.enum(['Card', 'Cash'], { message: 'Payment method must be Card or Cash' }),
  user_id: z.string().optional().nullable(),
  promo_code: z.string().optional().nullable()
});

// Admin login schema
const AdminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Update order status schema
const UpdateOrderStatusSchema = z.object({
  status: z.enum(
    ['created', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'failed'],
    { message: 'Invalid order status' }
  ),
  notes: z.string().optional().nullable()
});

// Stripe webhook event schema
const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any()
  })
});

/**
 * Validation error formatter
 */
function formatValidationError(error) {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map(err => ({
      field: err.path?.join('.') || 'unknown',
      message: err.message
    }));
  }
  return [{ field: 'unknown', message: error.message }];
}

module.exports = {
  OrderItemSchema,
  CustomerSchema,
  AddressSchema,
  CreateOrderSchema,
  AdminLoginSchema,
  UpdateOrderStatusSchema,
  StripeWebhookSchema,
  formatValidationError
};
