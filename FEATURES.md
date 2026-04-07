# SrokSre E-Commerce Platform - Feature Documentation

## Overview

SrokSre is a full-stack e-commerce platform built with Next.js 15, featuring advanced session management, role-based access control, and comprehensive order management capabilities.

---

## 🔐 Authentication & Security

### Session Management (`useCheckSession` Hook)

- **Auto-validation of user sessions** before API calls
- **JWT token expiration checking** with automatic renewal
- **Invalid session detection** with automatic sign-out
- **Toast notifications** for session expiration (5-second auto-close)
- **Multi-device session tracking** and management

### Login Security Features

- **Rate limiting** - Tracks failed login attempts
- **Account lockdown** after multiple failed attempts
- **IP address tracking** for security monitoring
- **Session token refresh** mechanism

### Protected Routes (Middleware)

- **Token expiration validation** on server-side
- **Role-based access control** (Admin vs User)
- **Automatic redirects** for unauthorized access
- **API route protection** with method-specific permissions

---

## 🏪 Customer-Facing Pages

### 1. **Home Page** (`/`)

- Product showcase and featured items
- Category navigation
- Hero section with promotions
- Public access, no authentication required

### 2. **Product Listing Page** (`/product`)

- Browse all products
- Filter and search capabilities
- Pagination support
- Public access

### 3. **Product Detail Page** (`/product/detail/[id]`)

- Detailed product information
- **Variant selection system** with dynamic pricing
- Product images gallery
- Add to cart functionality
- Stock availability display

### 4. **Checkout Page** (`/checkout`)

- **Multi-step checkout process**:
  1. Shipping information form
  2. Shipping method selection
  3. Payment processing
- **Session validation** before order placement
- **PayPal integration** for payments
- Order summary with calculated totals
- Shipping address validation

### 5. **Account Page** (`/account`)

- User login and registration
- Session-based redirects (redirects to dashboard if authenticated)
- Email/password authentication via NextAuth

---

## 📊 Dashboard Pages (Protected)

### 1. **Main Dashboard** (`/dashboard`)

**Features:**

- User profile overview
- Wishlist management
- Order history summary
- Profile editing (name, email, password, shipping info)
- **Session validation** on all data fetches

**Access:** Authenticated users (all roles)

---

### 2. **Order Management** (`/dashboard/order`)

**Features:**

- **Comprehensive order tracking**
  - View all orders with status filtering
  - Real-time status updates (Pending, Processing, Completed, Cancelled)
  - Order search by ID, customer name, or product
  - Date range filtering
  - Price range filtering
- **Order details modal** with:
  - Customer information
  - Product list with variants
  - Shipping details
  - Payment status
  - Order timeline
- **Admin capabilities:**
  - Update order status
  - Process refunds
  - Download invoice PDFs
  - Bulk order operations
- **Statistics dashboard:**
  - Total orders count
  - Revenue tracking
  - Status breakdown
- **Server-side rendering** with revalidation (60s)
- **Pagination** for large order lists
- **Session validation** on order updates

**Access:**

- All authenticated users (view own orders)
- Admins (view and manage all orders)

---

### 3. **Inventory Management** (`/dashboard/inventory`)

**Features:**

- **Product catalog management**
  - Add new products
  - Edit existing products
  - Delete products (soft delete)
  - Bulk operations
- **Variant management:**
  - Multiple variant types (size, color, material, etc.)
  - Variant-specific pricing
  - Variant-specific stock levels
  - Variant sections with custom attributes
- **Product details:**
  - Name, description, pricing
  - Discount management
  - Category assignment
  - Multiple image uploads
  - Stock tracking
- **Search and filtering:**
  - Search by product name/SKU
  - Filter by category
  - Filter by stock status
  - Sort by various fields
- **Session validation** on all product operations

**Access:** Admin only

---

### 4. **User Management** (`/dashboard/usermanagement`)

**Features:**

- **User administration:**
  - View all registered users
  - Create new user accounts
  - Edit user information
  - Delete users (bulk operations)
  - Role assignment (Admin/User)
- **User statistics:**
  - Total users count
  - Admin vs regular user breakdown
  - New users this month
- **Search and filtering:**
  - Search by name, email, phone
  - Filter by role
  - Sort by various fields (name, date, role)
- **Bulk operations:**
  - Multi-select users
  - Bulk delete
  - Bulk role updates
- **CSV export** functionality
- **Grid and list view modes**
- **Session validation** on all operations

**Access:** Admin only

---

### 5. **Device Management** (`/dashboard/devices`)

**Features:**

- **Multi-device session tracking:**
  - View all active sessions
  - Device information (browser, OS)
  - IP address tracking
  - Last used timestamp
  - Session creation date
  - Expiration time
- **Session management:**
  - Logout individual devices
  - Logout all other devices (keep current)
  - Current device indicator
- **Security monitoring:**
  - Detect unauthorized access
  - Review login history by device
- **Session validation** before operations

**Access:** All authenticated users

---

## 🛠️ Technical Features

### Performance Optimizations

- **Server-side rendering** for SEO and performance
- **Static generation** where applicable
- **React.memo** for component memoization
- **useCallback** and **useMemo** for expensive operations
- **Debounced search** inputs
- **Lazy loading** for images and components
- **Pagination** for large datasets

### State Management

- **Global context** for shared state
- **URL-based state** for filters/pagination (shareable links)
- **Local storage** for cart persistence
- **Session storage** for temporary data

### API Architecture

- **RESTful API routes** under `/api/*`
- **Role-based API protection** via middleware
- **Request validation** and error handling
- **Database connection pooling** with Prisma
- **Transaction support** for critical operations

### Database Schema

- **Users:** Authentication, profiles, roles
- **Products:** Inventory with variants
- **Orders:** Complete order lifecycle
- **Sessions:** Multi-device tracking
- **LoginAttempts:** Security monitoring
- **RefreshTokens:** Token management

---

## 🔧 Key Hooks & Utilities

### Custom Hooks

- **useCheckSession:** Session validation and auto-renewal
- **useGlobalContext:** Shared state management
- **useEffectOnce:** Run effect only once
- **ApiRequest:** Centralized API call handler
- **Delayloading:** Loading state with minimum delay

### Middleware Functions

- **Session validation** on protected routes
- **Role-based access control**
- **Token expiration checking**
- **Automatic pagination parameters**

### Authentication Flow

1. User logs in via `/account`
2. NextAuth creates session with JWT
3. Session stored in database
4. Client receives session cookie
5. Middleware validates on each request
6. `useCheckSession` validates on client-side actions
7. Auto-renewal when token near expiration
8. Auto-logout when session invalid

---

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes

---

## 🚀 Deployment & Configuration

- **Environment variables** for sensitive data
- **Database migrations** via Prisma
- **Build optimizations** for production
- **Error boundaries** for graceful failures
- **Logging** for debugging and monitoring

---

## 📝 Testing

- **Jest** for unit testing
- **React Testing Library** for component testing
- **Hook testing** with `renderHook`
- **Mock implementations** for external dependencies
- **Session validation tests** for security

---

## 🔒 Security Best Practices

✅ JWT token validation on every request  
✅ Role-based access control (RBAC)  
✅ Session expiration and refresh  
✅ Rate limiting on login attempts  
✅ IP address tracking  
✅ CSRF protection via tokens  
✅ SQL injection prevention via Prisma  
✅ XSS protection via React  
✅ Environment variable security  
✅ HTTPS enforcement in production

---

## 📊 Key Metrics & Analytics

- Order conversion tracking
- User registration trends
- Revenue analytics
- Product popularity metrics
- Session duration tracking
- Failed login monitoring

---

## 🎯 Future Enhancements

- Real-time order notifications
- Advanced analytics dashboard
- Email notification system
- Product reviews and ratings
- Wishlist sharing
- Gift card system
- Loyalty program
- Multi-language support
- Advanced search with filters
- Recommendation engine

---

## 📚 Documentation Structure

```
/src
  /app                  # Next.js 15 App Router pages
    /dashboard          # Protected dashboard pages
    /account            # Authentication pages
    /product            # Product browsing
    /checkout           # Checkout flow
  /hooks                # Custom React hooks
  /lib                  # Utility functions
  /context              # React context providers
  /types                # TypeScript definitions
  /_tests_              # Test suites
/prisma                 # Database schema & migrations
```

---

_Last Updated: February 19, 2026_
