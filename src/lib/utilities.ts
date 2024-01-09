import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase";

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
  File: File,
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
  filename: string,
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

export const removeSpaceAndToLowerCase = (str: string) =>
  str.replace(/\s/g, "").toLowerCase();

export const calculatePagination = (
  totalItem: number,
  itemPerPage: number,
  currentPage: number,
) => {
  const startIndex = (currentPage - 1) * itemPerPage;
  const endIndex = Math.min(startIndex + itemPerPage - 1, totalItem - 1);
  return {
    startIndex,
    endIndex,
  };
};
