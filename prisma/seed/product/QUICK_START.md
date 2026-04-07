# Product Seed Generator - Quick Start Guide

## ✅ What Was Created

### 1. Product Generator Functions
- **Location**: `prisma/seed/product/index.ts`
- **Functions**:
  - `createRandomNormalStockProduct({ count })` - Generates product data
  - `generatePlaceholderSVGs(count)` - Creates detailed SVG placeholders
  - `generateSimplePlaceholderSVGs(count)` - Creates gradient SVG placeholders
  - `getDefaultCategories()` - Returns default category structure

### 2. Database Seed Script
- **Location**: `prisma/seed/product/seed.ts`
- **Functions**:
  - `seedCategories()` - Seeds 5 parent categories with subcategories
  - `seedProducts(count)` - Seeds products with random data
  - `seedAll(count)` - Complete seeding process

### 3. Main Seed Integration
- **Location**: `prisma/seed.ts`
- Integrates admin and product seeding
- Controlled by environment variables

## 🚀 Usage

### Admin Only (Default)
```bash
npx prisma db seed
```

### Admin + Products
```bash
# Seed with 20 products (default)
SEED_PRODUCTS=true npx prisma db seed

# Seed with custom count
SEED_PRODUCTS=true SEED_PRODUCT_COUNT=50 npx prisma db seed
```

### Or set in .env
```env
SEED_PRODUCTS=true
SEED_PRODUCT_COUNT=30
```

Then run:
```bash
npx prisma db seed
```

## 📦 What Gets Created

### Categories (5 parent categories)
1. **Electronics** → Phones, Laptops, Tablets, Accessories
2. **Clothing** → Men, Women, Kids, Accessories
3. **Home & Garden** → Furniture, Decor, Kitchen, Garden
4. **Sports & Outdoors** → Fitness, Camping, Sports Wear, Equipment
5. **Books & Media** → Books, Movies, Music, Games

### Products (Customizable count)
Each product includes:
- ✅ Random realistic name
- ✅ Price: $10 - $510
- ✅ Stock: 5 - 105 units
- ✅ 2-4 placeholder SVG images
- ✅ Product details (Brand, Material, Color, Warranty)
- ✅ Description
- ✅ Random category assignment
- ✅ Sales/wishlist/cart statistics

## 🎨 Generated Data Example

```
✅ Created product: Premium Smart Camera (Home & Garden > Garden)
✅ Created product: Classic Digital Mouse (Clothing > Women)
✅ Created product: Vintage Wireless Keyboard (Electronics > Accessories)
```

## 📝 Example Output

```bash
🌱 Starting database seeding...

👤 Seeding Admin User...
✅ Admin user already exists: admin@sroksre.com

🛍️  Seeding Products & Categories...
🚀 Starting database seeding...

🌱 Seeding categories...
  ✅ Created parent category: Electronics
    ➕ Created subcategory: Phones
    ➕ Created subcategory: Laptops
✅ Categories seeded: 5 parent categories

🌱 Seeding 5 products...
  ✅ Created product: Premium Smart Camera (Home & Garden > Garden)
✅ Products seeded: 5/5

🎉 Database seeding completed successfully!
```

## 🔧 Customization

### Modify Product Names
Edit `productNameTemplates`, `clothingNames`, or `homeNames` in:
`prisma/seed/product/index.ts`

### Modify Categories
Edit `defaultCategories` array in:
`prisma/seed/product/index.ts`

### Change Price/Stock Ranges
Edit `createRandomNormalStockProduct()` function in:
`prisma/seed/product/index.ts`

## 📚 Documentation

- Main README: `prisma/SEED_README.md`
- Product Seed README: `prisma/seed/product/README.md`
- Environment Variables: `.env.example`

## 🧪 Testing

Run the example to see generated data:
```bash
npx tsx prisma/seed/product/example.ts
```
