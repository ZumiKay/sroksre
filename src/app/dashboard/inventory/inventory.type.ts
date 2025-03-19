export enum InventoryType {
  Product = "product",
  Banner = "banner",
  Promotion = "promotion",
}

export enum OpenContainerType {
  cProduct = "createProduct",
  cCategory = "createCategory",
  cBanner = "createBanner",
  cPromotion = "createPromotion",
}

export enum InventoryAction {
  EDIT = "Edit",
  STOCK = "Stock",
  DELETE = "DELETE",
}
export enum InventoryInfoType {
  Color = "COLOR",
  Text = "TEXT",
}

export enum StockType {
  Stock = "stock",
  Variant = "variant",
}

export enum ProductStockType {
  Size = "size",
  Variant = "variant",
  Stock = "stock",
}

export interface SelectionType<t = string> {
  label: string;
  value: t;
}
