"use client";

import Modal from "../Modals";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { motion } from "framer-motion";
import { Orderpricetype } from "@/src/types/order.type";
import { useEffect, useRef, useState } from "react";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../Loading";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faXmark,
  faBoxOpen,
  faChevronRight,
  faTag,
} from "@fortawesome/free-solid-svg-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Searchproducttype {
  id: number;
  name: string;
  parentcategory_id: number;
  childcategory_id?: number;
  price: Orderpricetype;
  covers: { name: string; url: string };
}

// ─── SearchContainer ──────────────────────────────────────────────────────────

export default function SearchContainer({ isMobile }: { isMobile: boolean }) {
  const { setopenmodal } = useGlobalContext();
  const [products, setProducts] = useState<Searchproducttype[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus the input when the overlay opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced live search — fires 380 ms after the user stops typing
  useEffect(() => {
    if (!search.trim()) {
      setProducts([]);
      setHasSearched(false);
      return;
    }
    const t = setTimeout(() => runSearch(search.trim()), 380);
    return () => clearTimeout(t);
  }, [search]);

  const runSearch = async (query: string) => {
    setLoading(true);
    const response = await ApiRequest(
      `/api/products?ty=search&q=${encodeURIComponent(query)}`,
      undefined,
      "GET",
    );
    setLoading(false);
    setHasSearched(true);
    if (!response.success) {
      errorToast("Search failed");
      return;
    }
    setProducts(response.data ?? []);
  };

  const handleClose = () =>
    setopenmodal((prev) => ({ ...prev, searchcon: false }));

  const handleNavigate = (id: number) => {
    handleClose();
    router.push(`/product/detail/${id}`);
  };

  return (
    <Modal
      closestate="searchcon"
      customwidth="100vw"
      customheight={isMobile ? "100vh" : "70vh"}
    >
      <motion.div
        initial={{ y: -500, height: 40 }}
        animate={{ y: 0, height: "100%" }}
        exit={{ y: -500, opacity: 0, height: 40 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="w-full h-full bg-white max-small_phone:rounded-none rounded-xl flex flex-col overflow-hidden"
      >
        {/* ── Inner layout — capped width on large screens ── */}
        <div className="w-full max-w-3xl mx-auto h-full flex flex-col px-4 md:px-6">
          {/* ── Search bar ── */}
          <div className="flex items-center gap-3 py-4 border-b border-gray-100 shrink-0">
            {/* Input */}
            <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm transition-all">
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-gray-400 text-sm shrink-0"
                />
              )}
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                </button>
              )}
            </div>

            {/* Cancel */}
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>

          {/* ── Results area ── */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Loading skeletons */}
            {loading && (
              <div className="flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
                      <div className="h-3 bg-gray-100 rounded-md w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && hasSearched && products.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {products.length} result{products.length !== 1 ? "s" : ""} for&nbsp;
                  <span className="text-gray-600">"{search}"</span>
                </p>
                <div className="flex flex-col gap-0.5">
                  {products.map((product) => (
                    <SearchResultRow
                      key={product.id}
                      product={product}
                      query={search}
                      onSelect={() => handleNavigate(product.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* No results */}
            {!loading && hasSearched && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faBoxOpen}
                    className="text-gray-300 text-xl"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600">
                    No products found
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Try a different keyword
                  </p>
                </div>
              </div>
            )}

            {/* Initial hint */}
            {!loading && !hasSearched && (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-gray-200 text-3xl"
                />
                <p className="text-sm text-gray-400">
                  Type to search for products
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Modal>
  );
}

// ─── SearchResultRow ──────────────────────────────────────────────────────────

function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-800 not-italic rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SearchResultRow({
  product,
  query,
  onSelect,
}: {
  product: Searchproducttype;
  query: string;
  onSelect: () => void;
}) {
  const hasDiscount = !!product.price.discount;

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
        <Image
          src={product.covers.url}
          alt={product.covers.name}
          width={56}
          height={56}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors leading-snug">
          <HighlightMatch text={product.name} query={query} />
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="text-sm font-bold text-blue-600">
                ${product.price.discount!.newprice?.toFixed(2)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                ${product.price.price.toFixed(2)}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 text-[10px] font-bold">
                <FontAwesomeIcon icon={faTag} className="text-[8px]" />
                -{product.price.discount!.percent}%
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-gray-700">
              ${product.price.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <FontAwesomeIcon
        icon={faChevronRight}
        className="text-gray-300 text-xs group-hover:text-blue-400 transition-colors shrink-0"
      />
    </button>
  );
}
