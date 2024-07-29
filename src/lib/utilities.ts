import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase";
import Prisma from "./prisma";
import {
  ProductState,
  Stocktype,
  infovaluetype,
} from "../context/GlobalContext";

import {
  getUser,
  Orderpricetype,
  Productordertype,
} from "../context/OrderContext";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { calculatePrice } from "../app/checkout/page";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { signOut } from "next-auth/react";

export const AllOrderStatusColor: Record<string, string> = {
  incart: "#495464",
  unpaid: "#EB5757",
  paid: "#35C191",
  preparing: "#0097FA",
  shipped: "#60513C",
  arrived: "#35C191",
};
export const postRequest = async (url: string, data: any) => {
  const post = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application.json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    cache: "default",
  });
  const jsonRes = await post.json();
  if (post.status === 200) {
    return jsonRes;
  } else {
    return { status: post.status, message: jsonRes.message };
  }
};

export const LoggedOut = async () => {
  const user = await getUser();

  if (user) {
    await Prisma.usersession.delete({ where: { session_id: user.session_id } });
    await signOut();
  }

  return true;
};

export const UploadImageToStorage = async (
  File: File
): Promise<{ sucess: boolean; url?: string; name?: string; type?: string }> => {
  try {
    const storageref = ref(storage, `productcovers/${File.name}`);
    await uploadBytes(storageref, File);
    const downloadURL = await getDownloadURL(storageref);

    return { sucess: true, url: downloadURL, name: File.name, type: File.type };
  } catch (error) {
    console.error("Firebase Storage", error);
    return { sucess: false };
  }
};
export const DeleteImageFromStorage = async (
  filename: string
): Promise<{ Sucess: boolean }> => {
  try {
    const deseRef = ref(storage, `productcovers/${filename}`);
    await deleteObject(deseRef);
    return { Sucess: true };
  } catch (error) {
    console.error("Firebase Storage", error);
    return { Sucess: false };
  }
};

export const removeSpaceAndToLowerCase = (str: String) =>
  str.replace(/\s/g, "").toLowerCase();

export const calculatePagination = (
  totalItem: number,
  itemPerPage: number,
  currentPage: number
) => {
  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = Math.min(startIndex + itemPerPage - 1, totalItem - 1);
  return {
    startIndex,
    endIndex,
  };
};

export const caculateArrayPagination = (
  arr: Array<any>,
  page: number,
  limit: number
) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return arr.slice(startIndex, endIndex);
};

export const generateRandomPassword = () => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  let password = "";
  for (let i = 0; i < 8; i++) {
    const randomidx = Math.floor(Math.random() * charset.length);
    password += charset[randomidx];
  }
  return password;
};
export const generateRandomNumber = () => {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);

  // Convert the number to a string
  const randomNumberString = randomNumber.toString();

  return randomNumberString;
};

export const checkpassword = (password: string) => {
  let error: string = "";
  let isValid = true;
  if (password.length < 8) {
    isValid = false;
    error = "Password Need to be aleast 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    isValid = false;
    error = "Password Need to contains aleast on upppercase letter";
  }
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password)) {
    isValid = false;
    error = "Password need to contain at least one special characters";
  }
  return { isValid, error };
};

export function getOneWeekFromToday(): Date {
  const today = new Date();
  const oneWeekFromToday = new Date(today.setDate(today.getDate() + 7));
  return oneWeekFromToday;
}

export const transformData = (data: any) => {
  const transformedData: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      transformedData[key] = data[key].reduce((result: any, item: any) => {
        const uniqueValues = new Set(item.info_value);

        result.push(...Array.from(uniqueValues, (size) => size));

        return result;
      }, []);
    }
  }

  return transformedData;
};

export function isIntOrBigInt(value: string) {
  // Check if the string is a valid integer
  function isInt(str: string) {
    const intRegex = /^-?\d+$/;
    if (!intRegex.test(str)) return false;
    const num = Number(str);
    return Number.isSafeInteger(num);
  }

  // Check if the string is a valid BigInt
  function isBigInt(str: string) {
    const bigIntRegex = /^-?\d+$/;
    if (!bigIntRegex.test(str)) return false;
    try {
      BigInt(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (isInt(value)) {
    return { type: "Int", value: Number(value) };
  } else if (isBigInt(value)) {
    return { type: "BigInt", value: BigInt(value) };
  } else {
    return { type: "Invalid", value: null };
  }
}

export const findDuplicateStockIndices = (stocks: Stocktype[]): number[] => {
  const seen: Map<string, number[]> = new Map();

  const duplicates: number[] = [];

  stocks.forEach((stock, index) => {
    const key = JSON.stringify({
      variant_id: stock.variant_id,
      variant_val: stock.variant_val,
    });

    if (seen.has(key)) {
      // Duplicate found, add index to duplicates array
      duplicates.push(index, ...(seen.get(key) as number[]));
    }

    if (!seen.has(key)) {
      seen.set(key, []);
    }

    seen.get(key)?.push(index);
  });

  return duplicates;
};
export const calculateCartTotalPrice = (
  cartItems: Array<Productordertype>
): number => {
  return cartItems.reduce((total, item) => {
    const { quantity, price } = item;

    console.log(price);
    const effectivePrice = price.discount
      ? price.discount.newprice
      : price.price;
    return total + (effectivePrice ?? 0) * quantity;
  }, 0);
};

export const getmaxqtybaseStockType = (
  product: ProductState,
  selected_detail: Array<string>
) => {
  const { stocktype, varaintstock, stock, details } = product;

  let qty = 0;

  if (stocktype === "stock") {
    qty = stock as number;
  } else if (stocktype === "variant") {
    varaintstock?.forEach((variant) => {
      const isStock = variant.variant_val.some((value) =>
        selected_detail.includes(value)
      );

      if (isStock) {
        qty = variant.qty;
        return true;
      }
      return false;
    });
  } else {
    const sizeInfo = details.find((detail) => detail.info_type === "SIZE");

    if (sizeInfo) {
      const size = sizeInfo.info_value.find(
        (value) => (value as infovaluetype).val === selected_detail[0]
      );

      if (size) {
        const result = size as infovaluetype;
        qty = result.qty;
      }
    }
  }

  return qty;
};

export const encrypt = (text: string, key: string) => {
  const algorithm = "aes-256-cbc";

  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, Buffer.from(key, "hex"), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string, key: string) => {
  const algorithm = "aes-256-cbc";
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift() as string, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");

  const keyBuffer = Buffer.from(key, "hex");

  const decipher = createDecipheriv(algorithm, keyBuffer, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const calculateDiscountPrice = (
  price: number,
  discount: number
): number => {
  const discountedAmount = (discount * price) / 100;
  return price - discountedAmount;
};

export const getDiscountedPrice = (discount: number, price: number) => {
  return {
    newprice: calculatePrice(price, discount),
    percent: discount,
  };
};

export function updateSearchParams(
  params: Record<string, string>,
  router: AppRouterInstance
) {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);

  Object.entries(params).forEach(([key, value]) => {
    if (searchParams.has(key)) {
      searchParams.set(key, `${searchParams.get(key)},${value}`);
    } else {
      searchParams.set(key, value);
    }
  });

  const newRelativePathQuery = `?${searchParams}`;

  router.replace(newRelativePathQuery);
}

export const isObjectEmpty = (data: Record<string, any>) =>
  Object.entries(data).every(([_, val]) => !val);

export const calculateDiscountProductPrice = (data: {
  price: number;
  discount?: number;
}): Orderpricetype => {
  if (data.discount) {
    return {
      price: data.price,
      discount: {
        newprice: data.price - (data.price * data.discount) / 100,
        percent: data.discount,
      },
    };
  }

  return { price: data.price };
};

export function stringToBoolean(str: string) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string");
  }

  switch (str.toLowerCase().trim()) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return null;
  }
}
//Email Template
//
//
//
//
//

export const normalemailtemplate = (
  warning: string,
  title: string,
  data: string
) =>
  `<style>
      body {
        min-width: 100vw;
        min-height: 100vh;
        font-family: Arial, Helvetica, sans-serif;
        background-color: #f2f2f2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        margin: 0;
        padding: 0;
      }
      .email_content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-wrap: nowrap;
        width: fit-content;
        height: 100%;
        position: relative;
        padding-bottom: 20px;
        background-color: white;
        padding: 20px;
      }
      .email_content .warning {
        width: 100%;
        font-size: 20px;
        word-break: break-all;
        font-weight: 800;
        color: lightcoral;
        text-align: center;
      }
      .email_content img {
        width: 100px;
        height: 100px;
        object-fit: contain;
      }
      .email_content .email_body .title {
        font-weight: 700;
        font-size: 25px;

        text-align: center;
        width: 100%;
        height: fit-content;
        padding: 3px;
      }
      .email_content .email_body .message {
        font-weight: 500;
        font-size: 20px;
        text-align: center;
        border: 2px solid black
        line-height: 2;
        width: max-content;
        height: auto;
        max-height: 85vh;
        padding: 5px;
        color: black;
        border-radius: 10px;
      }
      .email_content .footer_container {
        text-align: center;
        width: 100%;
        height: fit-content;
      }
      .email_content .footer_container .footer_text {
        font-weight: 500;
        font-size: 17px;
        color: lightcoral;
      }
      .email_content .footer_container .footer_text2 {
        font-weight: 500;
        font-size: 15px;
        color: black;
      }
    </style>
<body>
    <div class="email_content">
      <img
        src="https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo.svg?alt=media&token=5eb60253-4401-4fc9-a282-e635d132f050"
        alt="logo"
        loading="lazy"
      />

      <div class="email_body">
        <h3 class="title">${title}</h3>
        <h3 class="message">${data}</h3>
      </div>
      <footer class="footer_container">
        <h6 class="footer_text">
         ${warning} 
        </h6>
        <h6 class="footer_text2">CopyRight@ 2024 SrokSre</h6>
      </footer>
    </div>
  </body>
`;

export const listofprovinces = [
  "Banteay Meanchey",
  "Battambang",
  "Kampong Cham",
  "KampongChhang",
  "Kampong Speu",
  "Kampong Thom",
  "Kampot",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratié",
  "Mondulkiri",
  "Oddar Meanchey",
  "Pailin",
  "Phnom Penh",
  "Preah Vihear",
  "Pursat",
  "Prey Veng",
  "Ratanakiri",
  "Siem Reap",
  "Preah Sihanouk",
  "Stueng Treng",
  "Svay Rieng",
  "Takéo",
  "Tboung Khmum",
];
