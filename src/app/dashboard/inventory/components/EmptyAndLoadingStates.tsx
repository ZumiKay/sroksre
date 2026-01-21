"use client";
import React from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  type?: string;
}

interface LoadingStateProps {
  type?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type = "product" }) => {
  const getEmptyMessage = () => {
    switch (type) {
      case "banner":
        return {
          title: "No Banners Found",
          message: "Create your first banner by clicking on Action → Banner",
        };
      case "promotion":
        return {
          title: "No Promotions Found",
          message:
            "Create your first promotion by clicking on Action → Promotion",
        };
      default:
        return {
          title: "No Products Found",
          message: "Create your first product by clicking on Action → Product",
        };
    }
  };

  const { title, message } = getEmptyMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mb-6">
        <i className="fa-solid fa-inbox text-4xl text-gray-400"></i>
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md">{message}</p>
    </motion.div>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = "items",
}) => {
  return (
    <div className="col-span-full w-full h-fit flex flex-col gap-6 items-center py-10">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-white"></i>
      </div>
      <p className="text-lg font-semibold text-gray-600">Loading {type}...</p>
      <div className="w-full grid grid-cols-3 max-small_screen:grid-cols-2 max-smallest_tablet:grid-cols-1 gap-6 px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-lg animate-pulse"
          >
            <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
