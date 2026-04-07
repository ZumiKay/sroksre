import { Productordertype } from "@/src/types/order.type";
import {
  Addtocart as AddToCartAction,
  AddWishlist as AddWishlistAction,
} from "../action";
import { errorToast, successToast } from "@/src/app/component/Loading";

/**
 * Service for adding product to wishlist
 */
export const addToWishlistService = async (productId: number) => {
  try {
    const makereq = AddWishlistAction.bind(null, productId);
    const added = await makereq();

    if (!added.success) {
      errorToast(added.message);
      return { success: false, message: added.message };
    }

    successToast(added.message);
    return { success: true, message: added.message };
  } catch (error) {
    const message = "Failed to add to wishlist";
    errorToast(message);
    return { success: false, message };
  }
};

/**
 * Service for adding product to cart
 */
export const addToCartService = async (
  productorderdetail: Productordertype,
) => {
  try {
    const addtocart = AddToCartAction.bind(null, productorderdetail);
    const makerequest = await addtocart();

    if (!makerequest.success) {
      errorToast(makerequest.message ?? "Error Occurred");
      return { success: false, message: makerequest.message };
    }

    successToast("Added to cart");
    return { success: true, message: "Added to cart" };
  } catch (error) {
    const message = "Failed to add to cart";
    errorToast(message);
    return { success: false, message };
  }
};
