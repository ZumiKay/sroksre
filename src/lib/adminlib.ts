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
import Prisma from "./prisma";
import { Role } from "@/prisma/generated/prisma/enums";
import { userdata } from "../types/user.type";
import { hashPassword } from "./userlib";

export interface admindata {
  firstname: string;
  lastname: string;
  password: string;
  email: string;
  role: Role;
}

export const Createadmin = async (data: userdata) => {
  const isExist = await Prisma.user.findFirst({
    where: {
      email: data.email,
    },
  });

  if (isExist) {
    return null;
  }

  const createdAdmin = await Prisma.user.create({
    data: {
      firstname: data.firstname as string,
      lastname: data.lastname,
      password: hashPassword(data.password as string),
      email: data.email as string,
      role: "ADMIN",
    },
  });

  if (createdAdmin) {
    return true;
  } else {
    return null;
  }
};
