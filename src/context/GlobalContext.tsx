"use client";
import React, { useContext, useState } from "react";

export interface ProductInfo {
  info_title: string;
  info_value: string[];
  info_type: string;
}

export const DefaultSize = ["S", "M", "L", "XL"];

interface ProductState {
  name: string;
  price: number;
  seller_id: number;
  stock: number;
  cover: string[];
  category_id: number;
  details: ProductInfo[];
}

interface OpenModalState {
  createProduct: boolean;
  createCategory: boolean;
  productdetail: boolean;
  subcreatemenu_ivt: boolean;
}

interface GlobalIndexState {
  productdetailindex: number;
  productcovereditindex: number;
}
interface CateogoryState {
  name: string;
  gender?: string;
}

interface ContextType {
  openmodal: OpenModalState;
  setopenmodal: React.Dispatch<React.SetStateAction<OpenModalState>>;
  globalindex: GlobalIndexState;
  setglobalindex: React.Dispatch<React.SetStateAction<GlobalIndexState>>;
  product: ProductState;
  setproduct: React.Dispatch<React.SetStateAction<ProductState>>;
  category: CateogoryState[];
  setcategory: React.Dispatch<React.SetStateAction<CateogoryState[]>>;
}

const GlobalContext = React.createContext<ContextType | null>(null);

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [openmodal, setopenmodal] = useState({
    createProduct: false,
    createCategory: false,
    productdetail: false,
    subcreatemenu_ivt: false,
  });
  const [category, setcategory] = useState([
    {
      name: "",
    },
  ]);
  const [globalindex, setglobalindex] = useState({
    productdetailindex: -1,
    productcovereditindex: -1,
  });
  const [product, setproduct] = useState({
    name: "",
    price: 0.0,
    seller_id: 0,
    stock: 0,
    cover: [""],
    category_id: 0,
    details: [
      {
        info_title: "",
        info_value: [""],
        info_type: "",
      },
    ],
  });

  return (
    <GlobalContext.Provider
      value={{
        openmodal,
        setopenmodal,
        product,
        setproduct,
        globalindex,
        setglobalindex,
        category,
        setcategory,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("Context Not Found");
  } else {
    return context;
  }
};
