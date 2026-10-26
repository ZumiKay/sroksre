// export category operations
export {
  createCategory,
  updateCategory,
  deleteCategory,
  type Categorydata,
  type updateCategoryData,
  type Deletecategorydata,
} from "./admin/category.operations";

// export product operations
export {
  CreateProduct,
  EditProduct,
  DeleteProduct,
  GetAllProduct,
  GetProductByCategory,
  type updateProductData,
} from "./admin/product.operations";

// export variant operations
export { handleUpdateProductVariant } from "./admin/variant.operations";

// export stock operations
export { updateProductVariantStock } from "./admin/stock.operations";

// Admin user operations
import { Role } from "@/prisma/generated/prisma/enums";

export interface admindata {
  firstname: string;
  lastname: string;
  password: string;
  email: string;
  role: Role;
}

