import { deleteObject, ref } from "firebase/storage";
import { storage } from "./firebase";
import { ProductState } from "../context/GlobalContext";
import { Orderpricetype, Productordertype } from "../context/OrderContext";
import {
  CipherKey,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";

export const AllorderType = {
  orderdetail: "orderdetail",
  orderproduct: "orderproduct",
  orderaction: "orderaction",
  orderupdatestatus: "orderupdatestatus",
};

export const AllOrderStatusColor: Record<string, string> = {
  incart: "#495464",
  unpaid: "#EB5757",
  paid: "#35C191",
  preparing: "#0097FA",
  shipped: "#60513C",
  arrived: "#35C191",
};

export const GetOneWeekAgoDate = () => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  return oneWeekAgo;
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
export function IsNumber(str: string) {
  // Check if the input is a string and not empty
  if (typeof str !== "string" || str.trim() === "") {
    return false;
  }

  // Use parseFloat to convert the string to a number
  const num = parseFloat(str);

  // Check if the parsed number is not NaN and is finite
  return !isNaN(num) && isFinite(num);
}

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

export const calculateCartTotalPrice = (
  cartItems: Array<Productordertype>
): number => {
  return cartItems.reduce((total, item) => {
    const { quantity, price } = item;

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
  const { stocktype, varaintstock, stock } = product;

  let qty = 0;

  if (stocktype === "stock") {
    qty = stock as number;
  } else if (stocktype === "variant") {
    const selectedvalueset = new Set(selected_detail.map((i) => i));
    varaintstock?.forEach((variant) => {
      variant.Stockvalue.forEach((stock) => {
        if (
          stock.variant_val.length === selectedvalueset.size &&
          stock.variant_val.every((i) => selectedvalueset.has(i))
        ) {
          qty = stock.qty;
        }
      });
    });
  }

  return qty;
};

export const encrypt = (text: string, key: string) => {
  const algorithm = "aes-256-cbc";

  // Ensure the key is 32 bytes (256 bits)
  const keyBuffer = Buffer.from(
    key.padEnd(32, "0").slice(0, 32),
    "utf-8"
  ) as unknown as CipherKey;

  const iv = randomBytes(16); // Initialization vector
  const cipher = createCipheriv(algorithm, keyBuffer, iv as any);

  let encrypted = cipher.update(text, "utf-8");
  encrypted = Buffer.concat([encrypted as any, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string, key: string) => {
  const algorithm = "aes-256-cbc";
  const textParts = text.split(":");

  const iv = Buffer.from(textParts.shift() as string, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");

  // Ensure the key is 32 bytes (256 bits)
  const keyBuffer = Buffer.from(
    key.padEnd(32, "0").slice(0, 32),
    "utf-8"
  ) as unknown as CipherKey;

  const decipher = createDecipheriv(algorithm, keyBuffer, iv as any);

  let decrypted = decipher.update(encryptedText as any);
  decrypted = Buffer.concat([decrypted as any, decipher.final()]);

  return decrypted.toString("utf-8");
};

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
        newprice: parseFloat(
          (data.price - (data.price * data.discount) / 100).toFixed(2)
        ),
        percent: data.discount,
      },
    };
  }

  return { price: data.price };
};

export const HasPartialOverlap = (
  arr1: string[][],
  arr2: string[][]
): boolean => {
  const set1 = new Set(arr1.map((subArr) => subArr.join(",")));
  const set2 = new Set(arr2.map((subArr) => subArr.join(",")));

  const array1 = Array.from(set1);
  const array2 = Array.from(set2);

  for (let val of array1) {
    if (array2.includes(val)) {
      return true;
    }
  }

  return false;
};

export const HasExactMatch = (arr1: string[][], arr2: string[][]): boolean => {
  const set1 = new Set(arr1.map((subArr) => subArr.join(",")));
  const set2 = new Set(arr2.map((subArr) => subArr.join(",")));

  const array1 = Array.from(set1);
  const array2 = Array.from(set2);

  // Check if the two sets are exactly the same
  if (set1.size !== set2.size) {
    return false;
  }

  for (let val of array1) {
    if (!array2.includes(val)) {
      return false;
    }
  }

  return true;
};

//Email Template
//
//
//
//
//

export const OrderReciptEmail = (body: string) => `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>
  </title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!--[if mso]>
    <noscript>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
    </noscript>
  <![endif]-->
  <!--[if lte mso 11]>
  <style type="text/css">
  body {
    font-family: "Prompt", sans-serif;
  }
</style>
  <![endif]-->
  <!--[if !mso]><!-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
  <style type="text/css">
  @import url('https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap')
  </style>
  <!--<![endif]-->
</head>

<body style="font-family: "Prompt", sans-serif; width: fit-content;">
   ${body}
</body>

</html>

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
