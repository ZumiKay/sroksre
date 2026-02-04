import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { format } from "date-fns";
import { categorytype } from "../api/categories/route";

export interface PromotionProduct {
  id: number;
  name: string;
  price: number;
  discount: number | null;
  covers: { name: string; url: string }[];
  stock: number | null;
}

export interface Promotion {
  id: number;
  name: string;
  description?: string | null;
  banner?: any | null;
  Products: PromotionProduct[];
  expireAt?: string;
  createdAt?: Date;
}

/**
 * Fetch a single promotion with its products (paginated)
 */
export const fetchPromotion = async (
  id: number,
  page: number,
  show: number,
): Promise<Promotion | null> => {
  const skip = (page - 1) * show;

  const promotion = await Prisma.promotion.findUnique({
    where: {
      id,
      expireAt: { lt: new Date() },
    },
    select: {
      id: true,
      name: true,
      banner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      Products: {
        select: {
          id: true,
          name: true,
          price: true,
          discount: true,
          covers: { select: { name: true, url: true } },
          stock: true,
        },
        skip,
        take: show,
      },
    },
  });

  if (!promotion) return null;

  return {
    ...promotion,
    Products: promotion.Products.map((prod) => {
      if (prod.discount) {
        const discount = calculateDiscountProductPrice({
          discount: prod.discount,
          price: prod.price,
        });

        return {
          ...prod,
          discount: (discount.discount as any) ?? prod.discount,
        };
      }
      return prod;
    }),
    banner: promotion.banner
      ? {
          ...promotion.banner,
          image: promotion.banner.image as any,
        }
      : null,
  };
};

/**
 * Format date to Bangkok timezone
 */
const formatExpireAt = (date: Date): string => {
  const bkkDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return format(bkkDate, "M/dd 'at' hh:mm aaaa 'BKK'");
};

/**
 * Fetch all active promotions with formatted dates
 */
export const getAllPromotions = async (): Promise<Promotion[]> => {
  const promotions = await Prisma.promotion.findMany({
    where: { expireAt: { lte: new Date() } },
    select: {
      id: true,
      name: true,
      description: true,
      banner: true,
      expireAt: true,
      createdAt: true,
      Products: {
        select: {
          id: true,
          name: true,
          price: true,
          covers: {
            select: {
              url: true,
              name: true,
            },
          },
          discount: true,
        },
      },
    },
  });

  return promotions.map((promotion) => ({
    ...promotion,
    banner: promotion.banner
      ? { ...promotion.banner, image: promotion.banner.image as any }
      : null,
    Products: promotion.Products.map((prod) => {
      if (prod.discount) {
        const discount = calculateDiscountProductPrice({
          price: prod.price,
          discount: prod.discount,
        });

        return {
          ...prod,
          discount: (discount.discount as any) ?? prod.discount,
          stock: null,
        };
      }
      return { ...prod, stock: null };
    }),
    expireAt: `${formatExpireAt(promotion.createdAt)} to ${formatExpireAt(
      promotion.expireAt,
    )}`,
  }));
};

/**
 * Fetch category data based on parent and child IDs
 */
export const fetchCategoryData = async (
  pid?: string,
  cid?: string,
  ppid?: string,
) => {
  let subcate = undefined;
  let cate: any = undefined;

  if (!pid && cid) {
    // Fetch subcategory only
    const result = await Prisma.childcategories.findUnique({
      where: { id: parseInt(cid) },
      select: {
        id: true,
        name: true,
        Parentcategories: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
    subcate = result;
  } else if (pid || ppid) {
    // Fetch parent category with optional child
    const parentId = parseInt(pid ?? ppid ?? "0");
    const parent = await Prisma.parentcategories.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
    });

    if (parent && cid) {
      const child = await Prisma.childcategories.findUnique({
        where: { id: parseInt(cid) },
        select: {
          id: true,
          name: true,
        },
      });
      cate = { ...parent, sub: child };
    } else {
      cate = parent;
    }
  }

  return { cate, subcate };
};

/**
 * Generate JSON-LD structured data for products
 */
export const generateProductListSchema = async (
  products: any[],
  categoryName?: string,
) => {
  if (!products || products.length === 0) return null;

  const itemListElement = products.slice(0, 10).map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: product.name,
      image: product.covers?.[0]?.url || "",
      offers: {
        "@type": "Offer",
        price: product.discount
          ? product.price - (product.price * product.discount) / 100
          : product.price,
        priceCurrency: "USD",
        availability: product.stock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryName || "Product List",
    numberOfItems: products.length,
    itemListElement,
  };
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbSchema = (
  breadcrumbs: Array<{ label: string; href: string }>,
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `https://sroksre.com${crumb.href}`,
    })),
  };
};

/**
 * Fetch sale category for promotions
 */
export const fetchSaleCategory = async () => {
  return await Prisma.parentcategories.findFirst({
    where: { type: categorytype.sale },
    select: { id: true, name: true },
  });
};

/**
 * Fetch banner data by ID
 */
export const fetchBanner = async (id: number) => {
  // Reuse existing function from actions
  const { GetBannerLink } = await import("./action");
  return await GetBannerLink(id);
};

/**
 * Fetch enhanced metadata for SEO
 */
export const fetchCategoryMetadata = async (
  pid?: string,
  cid?: string,
  promoid?: string,
  search?: string,
  all?: string,
) => {
  let title = "SrokSre - Shop Quality Products Online";
  let description =
    "Discover amazing products at SrokSre. Browse our wide selection of quality items with great deals and fast shipping.";
  let keywords: string[] = ["SrokSre", "online shopping", "quality products"];
  let parentCateName = "";
  let childCateName = "";
  let imageUrl = "";

  // Fetch promotion metadata
  if (promoid) {
    const promotion = await Prisma.promotion.findUnique({
      where: { id: parseInt(promoid) },
      select: {
        name: true,
        description: true,
        banner: {
          select: {
            image: true,
          },
        },
        Products: {
          take: 1,
          select: {
            covers: {
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    if (promotion) {
      title = `${promotion.name} - Special Promotion | SrokSre`;
      description =
        promotion.description ||
        `Shop ${promotion.name} at SrokSre. Limited time offers on quality products.`;
      keywords.push(promotion.name.toLowerCase(), "promotion", "sale", "deals");

      // Get image from banner or first product
      const bannerImage = promotion.banner?.image as any;
      if (bannerImage?.url) {
        imageUrl = bannerImage.url;
      } else if (promotion.Products[0]?.covers[0]?.url) {
        imageUrl = promotion.Products[0].covers[0].url;
      }
    }
  }
  // Fetch category metadata
  else if (pid || cid) {
    if (pid) {
      const pcate = await Prisma.parentcategories.findUnique({
        where: { id: parseInt(pid) },
        select: {
          name: true,
          description: true,
          type: true,
          products: {
            take: 1,
            select: {
              covers: {
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      });

      if (pcate) {
        parentCateName = pcate.name;
        description = pcate.description || description;
        keywords.push(pcate.name.toLowerCase());

        // Get first product image
        if (pcate.products[0]?.covers[0]?.url) {
          imageUrl = pcate.products[0].covers[0].url;
        }

        // Handle special category types
        if (pcate.type === "sale") {
          keywords.push("sale", "deals", "discount");
        } else if (pcate.type === "latest") {
          keywords.push("new arrivals", "latest", "new products");
        }
      }
    }

    if (cid) {
      const ccate = await Prisma.childcategories.findUnique({
        where: { id: parseInt(cid) },
        select: {
          name: true,
        },
      });

      if (ccate) {
        childCateName = ccate.name;
        keywords.push(ccate.name.toLowerCase());

        // Get first product image from child category if not already set
        if (!imageUrl) {
          const firstProduct = await Prisma.products.findFirst({
            where: { childcategory_id: parseInt(cid) },
            select: {
              covers: {
                take: 1,
                select: { url: true },
              },
            },
          });
          if (firstProduct?.covers[0]?.url) {
            imageUrl = firstProduct.covers[0].url;
          }
        }
      }
    }

    // Build title
    const categoryPath = [parentCateName, childCateName]
      .filter(Boolean)
      .join(" - ");
    if (categoryPath) {
      title = `${categoryPath} | SrokSre`;
      if (!description || description === "") {
        description = `Shop ${categoryPath} at SrokSre. Browse our collection of quality products with competitive prices and fast delivery.`;
      }
    }
  }
  // Handle search
  else if (search) {
    title = `Search: "${search}" | SrokSre`;
    description = `Search results for "${search}". Find the best products matching your search at SrokSre.`;
    keywords.push("search", search.toLowerCase());
  }
  // Handle all products
  else if (all) {
    title = "All Products | SrokSre";
    description =
      "Browse all products available at SrokSre. Discover amazing deals on quality items across all categories.";
    keywords.push("all products", "catalog", "browse");
  }

  // Ensure description is not too long (ideal: 150-160 chars)
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }

  return {
    title,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title,
      description,
      type: "website" as const,
      siteName: "SrokSre",
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(imageUrl && {
        images: [imageUrl],
      }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `/product${pid ? `?pid=${pid}` : ""}${cid ? `${pid ? "&" : "?"}cid=${cid}` : ""}${promoid ? `?promoid=${promoid}` : ""}${search ? `?search=${search}` : ""}${all ? "?all=1" : ""}`,
    },
  };
};
