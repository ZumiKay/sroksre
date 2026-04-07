# Product Placeholder SVG Generator

Utility functions to generate placeholder SVG images for product covers during seeding or testing.

## Functions

### `generatePlaceholderSVGs(count: number): string[]`

Generates detailed placeholder SVGs with text, icons, and decorative elements.

**Features:**
- 800x600 resolution
- 10 different color schemes (rotating)
- Product number label
- "Placeholder Image" text
- Decorative icons (circle, rectangle, cross)
- Base64 encoded data URLs ready to use

**Example:**
```typescript
import { generatePlaceholderSVGs } from './prisma/seed/product';

const covers = generatePlaceholderSVGs(5);
// Returns 5 SVG data URLs
```

### `generateSimplePlaceholderSVGs(count: number): string[]`

Generates simple, modern gradient placeholder SVGs with numbered labels.

**Features:**
- 800x600 resolution
- 10 different gradient combinations
- Large centered number
- Minimalist design
- Base64 encoded data URLs

**Example:**
```typescript
import { generateSimplePlaceholderSVGs } from './prisma/seed/product';

const covers = generateSimplePlaceholderSVGs(10);
// Returns 10 gradient SVG data URLs
```

## Usage in Seed Scripts

```typescript
import Prisma from "@/src/lib/prisma";
import { generatePlaceholderSVGs } from "./product";

async function seedProducts() {
  const coverImages = generatePlaceholderSVGs(3);
  
  await Prisma.products.create({
    data: {
      name: "Sample Product",
      covers: {
        create: coverImages.map((imageData, index) => ({
          url: imageData,
          alt: `Product image ${index + 1}`,
          order: index,
        })),
      },
    },
  });
}
```

## Usage in Tests

```typescript
import { generateSimplePlaceholderSVGs } from './prisma/seed/product';

describe('Product Creation', () => {
  it('should create product with covers', () => {
    const mockCovers = generateSimplePlaceholderSVGs(2);
    
    const product = {
      name: 'Test Product',
      covers: mockCovers,
    };
    
    expect(product.covers).toHaveLength(2);
  });
});
```

## Output Format

Both functions return an array of data URLs in the format:
```
data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlna...
```

These can be used directly as:
- `<img>` src attributes
- CSS background images
- Database fields for image URLs
- API responses

## Color Schemes

### Detailed Placeholders
- Blue, Purple, Green, Orange, Pink
- Teal, Yellow, Red, Gray, Deep Purple

### Simple Gradients
- Purple gradient, Pink gradient, Blue gradient
- Green gradient, Sunset, Ocean
- Pastel, Orange, Fresh, Peach

## Run Example

```bash
npx tsx prisma/seed/product/example.ts
```
