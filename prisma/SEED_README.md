# Database Seeding

This project includes comprehensive Prisma seed scripts to create initial data for development.

## What Gets Seeded

### 1. Admin User (Always)
- ✅ One admin user with hashed password
- ✅ Verified email status
- ✅ ADMIN role permissions

### 2. Products & Categories (Optional)
- ✅ 5 parent categories with subcategories
- ✅ Customizable number of products
- ✅ Placeholder SVG images for product covers
- ✅ Random product details and specifications
- ✅ Realistic pricing and stock levels

## Usage

### Basic Seed (Admin Only)

```bash
# Run the seed script (admin user only)
npx prisma db seed
```

### Full Seed (Admin + Products)

Set environment variables in your `.env` file:

```env
SEED_PRODUCTS=true
SEED_PRODUCT_COUNT=50  # Optional, default is 20
```

Then run:

```bash
npx prisma db seed
```

Or set inline:

```bash
SEED_PRODUCTS=true SEED_PRODUCT_COUNT=30 npx prisma db seed
```

### Reset & Seed

```bash
# This will reset the database and run seed automatically
npx prisma migrate reset
```

## Default Admin Credentials

If no environment variables are set:

- **Email**: `admin@sroksre.com`
- **Password**: `Admin@123456`
- **Name**: Admin User
- **Phone**: +85512345678
- **Role**: ADMIN

⚠️ **Important**: Change the password after first login!

## Custom Configuration

### Admin Credentials

Set in your `.env` file:

```env
ADMIN_EMAIL="your-admin@example.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_FIRSTNAME="John"
ADMIN_LASTNAME="Doe"
ADMIN_PHONE="+85512345678"
```

### Product Seeding

```env
# Enable product seeding
SEED_PRODUCTS=true

# Number of products to generate
SEED_PRODUCT_COUNT=50
```

## Default Categories

When product seeding is enabled, the following categories are created:

1. **Electronics** → Phones, Laptops, Tablets, Accessories
2. **Clothing** → Men, Women, Kids, Accessories
3. **Home & Garden** → Furniture, Decor, Kitchen, Garden
4. **Sports & Outdoors** → Fitness, Camping, Sports Wear, Equipment
5. **Books & Media** → Books, Movies, Music, Games

## Generated Product Data

Each product includes:
- Random realistic name
- Price between $10 - $510
- Stock between 5 - 105 units
- 2-4 placeholder SVG cover images
- Product details (Brand, Material, Color, Warranty)
- Realistic description
- Random sales/wishlist/cart statistics
- Random category assignment

## Idempotent Seeding

The seed scripts are idempotent:
- ✅ Admin user: Skipped if already exists
- ✅ Categories: Skipped if already exist
- ✅ Products: Always created (no duplicate check)

## Direct Product Seeding

You can also seed products directly:

```bash
# Seed 30 products with categories
npx tsx prisma/seed/product/seed.ts
```

## Testing the Admin Account

After seeding, you can login with the admin credentials at your application's login page.
