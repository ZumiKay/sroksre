/**Create Seed For Product */

import {
  ProductState,
  StockTypeEnum,
  ProductInfo,
  productcoverstype,
  Varianttype,
  VariantTypeEnum,
  VariantValueObjType,
  Stocktype,
  VariantSectionType,
} from "@/src/types/product.type";

/**
 * Generate placeholder SVG images for product covers
 * @param count - Number of placeholder SVGs to generate
 * @returns Array of SVG data URLs
 */
export const generatePlaceholderSVGs = (count: number): string[] => {
  const svgs: string[] = [];
  const colors = [
    { bg: "#E3F2FD", text: "#1976D2" }, // Blue
    { bg: "#F3E5F5", text: "#7B1FA2" }, // Purple
    { bg: "#E8F5E9", text: "#388E3C" }, // Green
    { bg: "#FFF3E0", text: "#F57C00" }, // Orange
    { bg: "#FCE4EC", text: "#C2185B" }, // Pink
    { bg: "#E0F2F1", text: "#00796B" }, // Teal
    { bg: "#FFF9C4", text: "#F9A825" }, // Yellow
    { bg: "#FFEBEE", text: "#D32F2F" }, // Red
    { bg: "#F5F5F5", text: "#616161" }, // Gray
    { bg: "#EDE7F6", text: "#512DA8" }, // Deep Purple
  ];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const imageNumber = i + 1;

    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="${color.bg}"/>
        <circle cx="400" cy="250" r="80" fill="${color.text}" opacity="0.2"/>
        <text x="400" y="280" font-family="Arial, sans-serif" font-size="48" 
              fill="${color.text}" text-anchor="middle" font-weight="bold">
          Product ${imageNumber}
        </text>
        <text x="400" y="340" font-family="Arial, sans-serif" font-size="24" 
              fill="${color.text}" text-anchor="middle" opacity="0.7">
          Placeholder Image
        </text>
        <rect x="300" y="380" width="200" height="120" rx="10" 
              fill="none" stroke="${color.text}" stroke-width="3" opacity="0.3"/>
        <line x1="350" y1="410" x2="450" y2="470" stroke="${color.text}" 
              stroke-width="3" opacity="0.3" stroke-linecap="round"/>
        <line x1="450" y1="410" x2="350" y2="470" stroke="${color.text}" 
              stroke-width="3" opacity="0.3" stroke-linecap="round"/>
      </svg>
    `.trim();

    // Convert to base64 data URL
    const base64 = Buffer.from(svg).toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    svgs.push(dataUrl);
  }

  return svgs;
};

/**
 * Generate simple colored placeholder SVGs
 * @param count - Number of placeholder SVGs to generate
 * @returns Array of SVG data URLs
 */
export const generateSimplePlaceholderSVGs = (count: number): string[] => {
  const svgs: string[] = [];
  const gradients = [
    ["#667eea", "#764ba2"], // Purple gradient
    ["#f093fb", "#f5576c"], // Pink gradient
    ["#4facfe", "#00f2fe"], // Blue gradient
    ["#43e97b", "#38f9d7"], // Green gradient
    ["#fa709a", "#fee140"], // Sunset gradient
    ["#30cfd0", "#330867"], // Ocean gradient
    ["#a8edea", "#fed6e3"], // Pastel gradient
    ["#ff9a56", "#ff6a88"], // Orange gradient
    ["#96fbc4", "#f9f586"], // Fresh gradient
    ["#ffecd2", "#fcb69f"], // Peach gradient
  ];

  for (let i = 0; i < count; i++) {
    const [color1, color2] = gradients[i % gradients.length];
    const imageNumber = i + 1;

    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#grad${i})"/>
        <text x="400" y="320" font-family="Arial, sans-serif" font-size="120" 
              fill="white" text-anchor="middle" font-weight="bold" opacity="0.9">
          ${imageNumber}
        </text>
      </svg>
    `.trim();

    const base64 = Buffer.from(svg).toString("base64");
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    svgs.push(dataUrl);
  }

  return svgs;
};

/**
 * Default categories to be created if none exist
 */
export const defaultCategories = [
  {
    name: "Electronics",
    description: "Electronic devices and accessories",
    subcategories: ["Phones", "Laptops", "Tablets", "Accessories"],
  },
  {
    name: "Clothing",
    description: "Fashion and apparel",
    subcategories: ["Men", "Women", "Kids", "Accessories"],
  },
  {
    name: "Home & Garden",
    description: "Home furniture and garden supplies",
    subcategories: ["Furniture", "Decor", "Kitchen", "Garden"],
  },
  {
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor gear",
    subcategories: ["Fitness", "Camping", "Sports Wear", "Equipment"],
  },
  {
    name: "Books & Media",
    description: "Books, movies, and music",
    subcategories: ["Books", "Movies", "Music", "Games"],
  },
];

/**
 * Product name templates for generating realistic product names
 */
const productNameTemplates = [
  ["Premium", "Deluxe", "Professional", "Classic", "Modern", "Vintage"],
  ["Wireless", "Smart", "Digital", "Portable", "Compact", "Advanced"],
  [
    "Headphones",
    "Speaker",
    "Camera",
    "Watch",
    "Keyboard",
    "Mouse",
    "Monitor",
    "Tablet",
  ],
];

const clothingNames = [
  "Cotton T-Shirt",
  "Denim Jeans",
  "Leather Jacket",
  "Wool Sweater",
  "Silk Dress",
  "Casual Sneakers",
  "Running Shoes",
  "Baseball Cap",
];

const homeNames = [
  "Coffee Table",
  "Desk Lamp",
  "Wall Mirror",
  "Storage Cabinet",
  "Garden Hose",
  "Plant Pot",
  "Throw Pillow",
  "Area Rug",
];

/**
 * Generate a random product name
 */
const generateProductName = (categoryName: string): string => {
  if (categoryName.includes("Clothing") || categoryName.includes("Fashion")) {
    return clothingNames[Math.floor(Math.random() * clothingNames.length)];
  } else if (categoryName.includes("Home") || categoryName.includes("Garden")) {
    return homeNames[Math.floor(Math.random() * homeNames.length)];
  } else {
    const adjective =
      productNameTemplates[0][
        Math.floor(Math.random() * productNameTemplates[0].length)
      ];
    const feature =
      productNameTemplates[1][
        Math.floor(Math.random() * productNameTemplates[1].length)
      ];
    const product =
      productNameTemplates[2][
        Math.floor(Math.random() * productNameTemplates[2].length)
      ];
    return `${adjective} ${feature} ${product}`;
  }
};

/**
 * Generate random product details
 */
const generateProductDetails = (): ProductInfo[] => {
  const brands = [
    "TechPro",
    "HomeStyle",
    "SportMax",
    "Fashion Co",
    "Quality Plus",
  ];
  const materials = [
    "Aluminum",
    "Plastic",
    "Wood",
    "Fabric",
    "Leather",
    "Metal",
  ];
  const colors = ["Black", "White", "Silver", "Blue", "Red", "Green"];

  return [
    {
      info_title: "Brand",
      info_value: [brands[Math.floor(Math.random() * brands.length)]],
      info_type: "text" as any,
    },
    {
      info_title: "Material",
      info_value: [materials[Math.floor(Math.random() * materials.length)]],
      info_type: "text" as any,
    },
    {
      info_title: "Color",
      info_value: [colors[Math.floor(Math.random() * colors.length)]],
      info_type: "text" as any,
    },
    {
      info_title: "Warranty",
      info_value: ["1 Year"],
      info_type: "text" as any,
    },
  ];
};

/**
 * Generate product descriptions
 */
const generateDescription = (productName: string): string => {
  const descriptions = [
    `High-quality ${productName} designed for everyday use. Features durable construction and modern design.`,
    `Experience premium quality with our ${productName}. Perfect for both personal and professional use.`,
    `The ${productName} combines style and functionality. Built to last with attention to detail.`,
    `Discover the perfect ${productName} for your needs. Reliable, efficient, and stylish.`,
    `Top-rated ${productName} with exceptional performance. A must-have addition to your collection.`,
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

/**
 * Create random normal stock products
 * @param count - Number of products to generate (default: 10)
 * @returns Array of ProductState objects
 */
export const createRandomNormalStockProduct = ({
  count = 10,
}: {
  count?: number;
}): Array<ProductState> => {
  const products: ProductState[] = [];

  // Generate products
  for (let i = 0; i < count; i++) {
    // Random category selection (will be assigned from actual categories later)
    const categoryIndex = Math.floor(Math.random() * defaultCategories.length);
    const category = defaultCategories[categoryIndex];
    const subcategoryIndex = Math.floor(
      Math.random() * category.subcategories.length,
    );

    const productName = generateProductName(category.name);
    const price = parseFloat((Math.random() * 500 + 10).toFixed(2)); // Random price between $10 and $510
    const stock = Math.floor(Math.random() * 100) + 5; // Random stock between 5 and 105

    // Generate 2-4 cover images per product
    const coverCount = Math.floor(Math.random() * 3) + 2;
    const coverSvgs = generateSimplePlaceholderSVGs(coverCount);
    const covers: productcoverstype[] = coverSvgs.map((svg, idx) => ({
      url: svg,
      type: "image",
      name: `${productName.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}.svg`,
      isSaved: true,
    }));

    const product: ProductState = {
      name: productName,
      price: price,
      description: generateDescription(productName),
      stocktype: StockTypeEnum.normal,
      covers: covers,
      category: {
        parent_id: categoryIndex + 1, // Placeholder, will be replaced with actual IDs
        child_id: subcategoryIndex + 1, // Placeholder
      },
      details: generateProductDetails(),
      stock: stock,
      amount_sold: Math.floor(Math.random() * 50),
      amount_incart: Math.floor(Math.random() * 10),
      amount_wishlist: Math.floor(Math.random() * 20),
    };

    products.push(product);
  }

  return products;
};

// ─── Shared seed fixtures ─────────────────────────────────────────────────────

const SEED_COLORS: VariantValueObjType[] = [
  { val: "#C62828", name: "Red" },
  { val: "#1565C0", name: "Blue" },
  { val: "#2E7D32", name: "Green" },
  { val: "#212121", name: "Black" },
  { val: "#F9A825", name: "Yellow" },
  { val: "#6A1B9A", name: "Purple" },
];

const SEED_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

// ─── Private seed helpers ─────────────────────────────────────────────────────

/** Cartesian product: [["A","B"],["1","2"]] → [["A","1"],["A","2"],["B","1"],["B","2"]] */
function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((v) => [...combo, v])),
    [[]],
  );
}

/** Randomly pick `n` items from an array (without repeats). */
function pick<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

/**
 * Build one Stock entry whose Stockvalue rows cover every cartesian
 * combination of the provided variant value lists.
 */
function buildVariantStock(variantValueLists: string[][]): Stocktype[] {
  return [
    {
      qty: 0,
      Stockvalue: cartesian(variantValueLists).map((combo) => ({
        qty: Math.floor(Math.random() * 46) + 5, // 5–50
        variant_val: combo,
      })),
    },
  ];
}

function makeCovers(productName: string, count: number): productcoverstype[] {
  return generateSimplePlaceholderSVGs(count).map((svg, idx) => ({
    url: svg,
    type: "image",
    name: `${productName.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}.svg`,
    isSaved: true,
  }));
}

function randomCategoryIndexes() {
  const catIdx = Math.floor(Math.random() * defaultCategories.length);
  const subIdx = Math.floor(
    Math.random() * defaultCategories[catIdx].subcategories.length,
  );
  return { catIdx, subIdx };
}

/**
 * No price or qty overrides on the variants themselves.
 */
export const createVariantStockProduct = ({
  count = 1,
}: {
  count?: number;
}): Array<ProductState> => {
  const products: ProductState[] = [];

  for (let i = 0; i < count; i++) {
    const { catIdx, subIdx } = randomCategoryIndexes();
    const name = generateProductName(defaultCategories[catIdx].name);
    const colors = pick(SEED_COLORS, 3);
    const sizes = pick(SEED_SIZES, 3);

    const Variant: Varianttype[] = [
      {
        option_title: "Color",
        option_type: VariantTypeEnum.color,
        option_value: colors,
        optional: false,
      },
      {
        option_title: "Size",
        option_type: VariantTypeEnum.text,
        option_value: sizes,
        optional: false,
      },
    ];

    products.push({
      name,
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      description: generateDescription(name),
      stocktype: StockTypeEnum.variants,
      covers: makeCovers(name, Math.floor(Math.random() * 3) + 2),
      category: { parent_id: catIdx + 1, child_id: subIdx + 1 },
      details: generateProductDetails(),
      Variant,
      Stock: buildVariantStock([colors.map((c) => c.val), sizes]),
      amount_sold: Math.floor(Math.random() * 50),
      amount_incart: Math.floor(Math.random() * 10),
      amount_wishlist: Math.floor(Math.random() * 20),
    });
  }

  return products;
};

/**
 * per-variant quantity .
 */
export const createVariantStockWithPriceQtyProduct = ({
  count = 1,
}: {
  count?: number;
}): Array<ProductState> => {
  const products: ProductState[] = [];

  for (let i = 0; i < count; i++) {
    const { catIdx, subIdx } = randomCategoryIndexes();
    const name = generateProductName(defaultCategories[catIdx].name);
    const colors = pick(SEED_COLORS, 3);
    const sizes = pick(SEED_SIZES, 3);

    const Variant: Varianttype[] = [
      {
        option_title: "Color",
        option_type: VariantTypeEnum.color,
        option_value: colors,
        optional: false,
        price: parseFloat((Math.random() * 20).toFixed(2)),
        qty: Math.floor(Math.random() * 46) + 5,
      },
      {
        option_title: "Size",
        option_type: VariantTypeEnum.text,
        option_value: sizes,
        optional: false,
        price: parseFloat((Math.random() * 5).toFixed(2)),
        qty: Math.floor(Math.random() * 46) + 5,
      },
    ];

    products.push({
      name,
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      description: generateDescription(name),
      stocktype: StockTypeEnum.variants,
      covers: makeCovers(name, Math.floor(Math.random() * 3) + 2),
      category: { parent_id: catIdx + 1, child_id: subIdx + 1 },
      details: generateProductDetails(),
      Variant,
      Stock: buildVariantStock([colors.map((c) => c.val), sizes]),
      amount_sold: Math.floor(Math.random() * 50),
      amount_incart: Math.floor(Math.random() * 10),
      amount_wishlist: Math.floor(Math.random() * 20),
    });
  }

  return products;
};

/**
 * Products where variants are grouped into named VariantSections.
 * No price or qty overrides.
 */
export const createVariantWithSectionProduct = ({
  count = 1,
}: {
  count?: number;
}): Array<ProductState> => {
  const products: ProductState[] = [];

  for (let i = 0; i < count; i++) {
    const { catIdx, subIdx } = randomCategoryIndexes();
    const name = generateProductName(defaultCategories[catIdx].name);
    const colors = pick(SEED_COLORS, 3);
    const sizes = pick(SEED_SIZES, 3);

    const colorVariant: Varianttype = {
      option_title: "Color",
      option_type: VariantTypeEnum.color,
      option_value: colors,
      optional: false,
      sectionId: 1,
    };
    const sizeVariant: Varianttype = {
      option_title: "Size",
      option_type: VariantTypeEnum.text,
      option_value: sizes,
      optional: false,
      sectionId: 2,
    };

    const Variantsection: VariantSectionType[] = [
      { tempId: 1, name: "Style", Variants: [colorVariant] },
      { tempId: 2, name: "Size", Variants: [sizeVariant] },
    ];

    products.push({
      name,
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      description: generateDescription(name),
      stocktype: StockTypeEnum.variants,
      covers: makeCovers(name, Math.floor(Math.random() * 3) + 2),
      category: { parent_id: catIdx + 1, child_id: subIdx + 1 },
      details: generateProductDetails(),
      Variant: [colorVariant, sizeVariant],
      Variantsection,
      Stock: buildVariantStock([colors.map((c) => c.val), sizes]),
      amount_sold: Math.floor(Math.random() * 50),
      amount_incart: Math.floor(Math.random() * 10),
      amount_wishlist: Math.floor(Math.random() * 20),
    });
  }

  return products;
};

/**
 * per-variant quantity.
 */
export const createVariantWithSectionPriceQtyProduct = ({
  count = 1,
}: {
  count?: number;
}): Array<ProductState> => {
  const products: ProductState[] = [];

  for (let i = 0; i < count; i++) {
    const { catIdx, subIdx } = randomCategoryIndexes();
    const name = generateProductName(defaultCategories[catIdx].name);
    const colors = pick(SEED_COLORS, 3);
    const sizes = pick(SEED_SIZES, 3);

    const colorVariant: Varianttype = {
      option_title: "Color",
      option_type: VariantTypeEnum.color,
      option_value: colors,
      optional: false,
      price: parseFloat((Math.random() * 20).toFixed(2)),
      qty: Math.floor(Math.random() * 46) + 5,
      sectionId: 1,
    };
    const sizeVariant: Varianttype = {
      option_title: "Size",
      option_type: VariantTypeEnum.text,
      option_value: sizes,
      optional: false,
      price: parseFloat((Math.random() * 5).toFixed(2)),
      qty: Math.floor(Math.random() * 46) + 5,
      sectionId: 2,
    };

    const Variantsection: VariantSectionType[] = [
      { tempId: 1, name: "Style", Variants: [colorVariant] },
      { tempId: 2, name: "Size", Variants: [sizeVariant] },
    ];

    products.push({
      name,
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      description: generateDescription(name),
      stocktype: StockTypeEnum.variants,
      covers: makeCovers(name, Math.floor(Math.random() * 3) + 2),
      category: { parent_id: catIdx + 1, child_id: subIdx + 1 },
      details: generateProductDetails(),
      Variant: [colorVariant, sizeVariant],
      Variantsection,
      Stock: buildVariantStock([colors.map((c) => c.val), sizes]),
      amount_sold: Math.floor(Math.random() * 50),
      amount_incart: Math.floor(Math.random() * 10),
      amount_wishlist: Math.floor(Math.random() * 20),
    });
  }

  return products;
};

/**
 * Category data for seeding
 */
export interface CategorySeedData {
  parentCategories: Array<{
    name: string;
    description: string;
    subcategories: string[];
  }>;
}

/**
 * Get default category seed data
 */
export const getDefaultCategories = (): CategorySeedData => {
  return {
    parentCategories: defaultCategories,
  };
};
