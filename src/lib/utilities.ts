import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase";
import Prisma from "./prisma";
import colornames from "color-name-list";

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

export const checkloggedsession = async (uid: string) => {
  const usersession = await Prisma.usersession.findMany({
    where: {
      user_id: uid,
    },
  });
  if (usersession.length > 0) {
    await Prisma.$disconnect();
    return { success: true };
  }
  await Prisma.$disconnect();
  return { success: false };
};
export const removeDuplicates = (transformedData: any) => {
  for (const key in transformedData) {
    if (transformedData.hasOwnProperty(key)) {
      transformedData[key] = Array.from(
        new Set(transformedData[key].map(JSON.stringify)),
        JSON.parse
      );
    }
  }
  return transformedData;
};
const getColorName = (hexcode: string) => {
  let colorname = colornames.find((color: any) => color.hex === hexcode);

  if (colorname) {
    return colorname.name;
  } else {
    return "Unkown";
  }
};

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
