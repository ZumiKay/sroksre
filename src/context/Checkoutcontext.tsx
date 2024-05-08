export const Shippingservice = [
  {
    type: "Standard",
    price: 10,
    estimate: "1-2 weeks",
    value: "Normal",
  },
  {
    type: "Express Delivery",
    price: 25,
    estimate: "3-5 days",
    value: "Express",
  },
  {
    type: "Store Pickup",
    price: 0,
    estimate: "Anytime 9am to 5pm",
    value: "Pickup",
  },
];
export const CountryCode = {
  cambodia: "KH",
};

type Paypalamount = {
  currency_code: string;
  value: string;
};

export interface Paypalitemtype {
  name: string;
  quantity: string;
  url?: string;
  image_url?: string;
  unit_amount: Paypalamount;
}
export interface Paypalamounttype {
  currency_code: string;
  value: string;
  breakdown: {
    shipping: Paypalamount;
    item_total: Paypalamount;
  };
}

export interface PaypalshippingType {
  type: "SHIPPING" | "NO_SHIPPING";

  address?: {
    address_line_1: string;
    address_line_2?: string;
    admin_area_2?: string;
    postal_code: string;
    country_code: string;
  };
}

export interface PurcahseUnitType {
  items: Array<Paypalitemtype>;
  amount: Paypalamounttype;
  shipping?: PaypalshippingType;
}

export interface Stepindicatortype {
  idx?: number;
  step: number;
  title: string;
  active: boolean;
  noline?: boolean;
}

//helper method
