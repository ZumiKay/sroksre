import { Orderpricetype, Productordertype } from "../context/OrderContext";
import {
  CipherKey,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { ProductState } from "../context/GlobalType.type";

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

export const removeSpaceAndToLowerCase = (str: string) =>
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
  arr: Array<unknown>,
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
export const generateRandomNumber = (length?: number): string => {
  // Use 8 as the default length if not provided
  const finalLength = length ?? 8;

  // Validate the length
  if (finalLength <= 0) {
    throw new Error("Length must be a positive number");
  }

  // Calculate range for the given length
  const min = Math.pow(10, finalLength - 1); // e.g., 100000 for length 6
  const max = Math.pow(10, finalLength) - 1; // e.g., 999999 for length 6

  // Generate and return the random number as a string
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
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
  const cipher = createCipheriv(algorithm, keyBuffer, iv as never);

  let encrypted = cipher.update(text, "utf-8");
  encrypted = Buffer.concat([encrypted as never, cipher.final() as never]);

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

  const decipher = createDecipheriv(algorithm, keyBuffer, iv as never);

  let decrypted = decipher.update(encryptedText as never);
  decrypted = Buffer.concat([decrypted as never, decipher.final() as never]);

  return decrypted.toString("utf-8");
};

export const calculateDiscountPrice = (price: number, discount: number) => ({
  percent: discount,
  newprice: (price - (price * discount) / 100).toFixed(2),
});

export const isObjectEmpty = (data: Record<string, unknown>) =>
  Object.values(data).every((val) => !val);

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

  for (const val of array1) {
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

  for (const val of array1) {
    if (!array2.includes(val)) {
      return false;
    }
  }

  return true;
};

export function compareArrays<T>(
  arr1: T[],
  arr2: T[],
  options: {
    strictOrder?: boolean; // If true, order matters
    deepCompare?: boolean; // If true, performs deep comparison for objects
  } = { strictOrder: true, deepCompare: false }
): boolean {
  // Check if arrays are the same reference
  if (arr1 === arr2) return true;

  // Check if either array is null/undefined or lengths differ
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;

  // Strict order comparison
  if (options.strictOrder) {
    for (let i = 0; i < arr1.length; i++) {
      if (
        options.deepCompare &&
        typeof arr1[i] === "object" &&
        typeof arr2[i] === "object"
      ) {
        if (!deepEqual(arr1[i] as never, arr2[i] as never)) return false;
      } else if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
  }

  // Unordered comparison
  const map = new Map<T, number>();

  // Count occurrences in first array
  for (const item of arr1) {
    map.set(item, (map.get(item) || 0) + 1);
  }

  // Subtract occurrences from second array
  for (const item of arr2) {
    const count = map.get(item);
    if (!count) return false;
    map.set(item, count - 1);
    if (count - 1 === 0) map.delete(item);
  }

  return map.size === 0;
}

// Helper function for deep object comparison
function deepEqual(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 == null ||
    obj2 == null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (
      !keys2.includes(key) ||
      !deepEqual(obj1[key] as never, obj2[key] as never)
    ) {
      return false;
    }
  }
  return true;
}

export const searchParamsToObject = (
  searchParams?: URLSearchParams
): Record<string, string | undefined> => {
  const result: Record<string, string> = {};
  searchParams?.forEach((value, key) => {
    result[key] = value;
  });
  return result;
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
