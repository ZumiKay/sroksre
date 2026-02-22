import { generateRandomNumber } from "@/src/lib/utilities";
import {
  Allstatus,
  Ordertype,
  Productordertype,
  ShippingTypeEnum,
} from "@/src/types/order.type";
import { StockTypeEnum } from "@/src/types/product.type";

interface GenerateOrderDataOptions {
  customField?: Partial<Ordertype>;
  count?: number;
  orderProductCount?: number;
}

/**
 * Helper function to generate OrderProduct items
 */
export const generateOrderProduct = (count: number = 1): Productordertype[] => {
  return Array.from({ length: count }, (_, index) => {
    const basePrice = Math.floor(Math.random() * 200) + 50; // Random price 50-250
    const discountPercent = Math.floor(Math.random() * 30) + 5; // Random discount 5-35%
    const newPrice = Math.floor(basePrice * (1 - discountPercent / 100)); // Calculate valid discounted price

    return {
      id: index + 1,
      quantity: Math.floor(Math.random() * 5) + 1, // Random quantity 1-5
      price: {
        price: basePrice,
        discount: {
          percent: discountPercent,
          newprice: newPrice,
        },
      },
      productId: index + 1,
      maxqty: Math.floor(Math.random() * 50) + 10, // Random max 10-60
      status: Allstatus.paid,
      product: {
        id: index + 1,
        name: `Test Product ${index + 1}`,
        price: basePrice,
        description: `Description for product ${index + 1}`,
        stocktype: StockTypeEnum.normal,
        stock: Math.floor(Math.random() * 50) + 10,
        covers: [],
        category: { parent_id: 1, child_id: 1 },
        details: [],
        Stock: [],
      },
    };
  });
};

export const generateOrderData = ({
  customField = {},
  count = 1,
  orderProductCount = 1,
}: GenerateOrderDataOptions = {}): Ordertype | Ordertype[] => {
  const generateSingleOrder = (): Ordertype => {
    const generatedId = generateRandomNumber().toString();
    const orderProducts = generateOrderProduct(orderProductCount);

    // Calculate totals based on order products
    const subtotal = orderProducts.reduce((sum, product) => {
      const productPrice =
        product.price.discount?.newprice ?? product.price.price;
      return sum + productPrice * product.quantity;
    }, 0);
    const vat = Math.round(subtotal * 0.1); // 10% VAT
    const shipping = 10;
    const total = subtotal + vat + shipping;

    return {
      id: generatedId,
      buyer_id: "uniqueBuyerId",
      Orderproduct: orderProducts,
      status: Allstatus.paid,
      price: {
        subtotal,
        vat,
        shipping,
        total,
      },
      estimate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      shipping_id: 1,
      shipping: {
        id: 1,
        street: "",
        firstname: "firname",
        lastname: "lastname",
        songkhat: "sangg",
        district: "dis",
        houseId: "111",
        province: "phnomPenh",
        postalcode: "123602",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
      },
      shippingtype: ShippingTypeEnum.standard,
      createdAt: new Date(),
      updatdAt: new Date(),
      user: {
        id: 1,
        firstname: "Test",
        lastname: "User",
        email: "test@example.com",
      },
      ...customField,
    };
  };

  if (count === 1) {
    return generateSingleOrder();
  }

  return Array.from({ length: count }, () => generateSingleOrder());
};
