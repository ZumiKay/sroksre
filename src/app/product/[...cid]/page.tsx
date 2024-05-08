"use client";
import { useEffect, useState } from "react";
import PrimaryButton, { Selection } from "../../component/Button";
import PaginationComponent from "../../component/Pagination";
import { ApiRequest } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";

import Card from "../../component/Card";
import LoadingIcon from "../../component/Loading";

import Link from "next/link";
import { FilterMenu } from "../../component/SideMenu";

export default function ProductsPage({
  params,
}: {
  params: { cid: Array<String> };
}) {
  const {
    setitemlength,
    allData,
    setalldata,
    openmodal,
    setopenmodal,
    listproductfilter,
    setlistprodfil,
    seterror,

    setproductfilval,
  } = useGlobalContext();
  const [show, setshow] = useState(1);
  const [loading, setloading] = useState(true);
  const [name, setname] = useState("");
  const [page, setpage] = useState(1);

  const [cate, setcate] = useState<any>({});
  const [totalprob, settotalprob] = useState(0);

  const fetchallfilval = async () => {
    const request = await ApiRequest(
      `/api/products/ty=getfilval_pc=${params.cid[0]}${
        params.cid[1] ? `_cc=${params.cid[1]}` : ""
      }`,
      undefined,
      "GET"
    );
    if (request.success) {
      setproductfilval(request.data);
    }
  };
  const fetchcate = async () => {
    const URL = `/api/categories/vfy?pcid=${params.cid[0]}${
      params.cid[1] ? `&ccid=${params.cid[1]}` : ""
    }`;
    const request = await ApiRequest(URL, undefined, "GET");
    if (!request.success) {
      return null;
    }
    return request.data;
  };
  const verifyCate = async () => {
    const verified = await fetchcate();

    if (!verified) {
      seterror(true);
      return;
    }

    const name =
      params.cid.length === 1
        ? verified.name
        : `${verified.sub.name} (${verified.name})`;
    setcate(verified);
    setname(name);
    await fetchallfilval();
  };

  useEffect(() => {
    verifyCate();
  }, []);

  const fetchproduct = async () => {
    //products
    const hasColorFilter = listproductfilter.color.length > 0;
    const hasSizeFilter = listproductfilter.size.length > 0;
    const hasOtherFilter = listproductfilter.text.length > 0;

    const colorQueryString = hasColorFilter
      ? `_dc=${listproductfilter.color.join(",").replaceAll("#", "")}`
      : "";
    const sizeQueryString = hasSizeFilter
      ? `_ds=${listproductfilter.size.join(",")}`
      : "";
    const textQuertString = hasOtherFilter
      ? `_dt=${listproductfilter.text.join(",")}`
      : "";

    const URL =
      hasColorFilter || hasSizeFilter
        ? `/api/products/ty=detail${colorQueryString}${sizeQueryString}${textQuertString}_pc=${
            params.cid[0]
          }${
            params.cid[1] ? `_cc=${params.cid[1]}` : ""
          }_p=${page}_limit=${show}`
        : `/api/products/ty=filter_pc=${params.cid[0]}${
            params.cid[1] ? `_cc=${params.cid[1]}` : ""
          }${
            listproductfilter.order ? `_po=${listproductfilter.order}` : ""
          }_p=${page}_limit=${show}`;
    const request = await ApiRequest(URL, undefined, "GET");
    setloading(false);
    if (!request.success) {
      return;
    }
    setalldata((prev) => ({ ...prev, product: request.data }));
    setitemlength({
      total: request.total ?? 0,
      totalpage: request.totalpage ?? 0,
    });
    settotalprob(request.totalfilter ?? 0);
  };

  useEffect(() => {
    if (params.cid.length > 2) {
      return;
    }
    setloading(true);
    fetchproduct();
  }, [page, show, listproductfilter]);

  return (
    <div className="products_page relative w-full min-h-[100vh] h-fit">
      {loading && <LoadingIcon />}
      <div className="header_section w-full h-fit flex flex-col items-start gap-y-2">
        <h1 className="category_name text-3xl w-fit font-normal text-black text-center pt-3 pl-5 italic">
          {name}
        </h1>
        <div className="path_container flex flex-row items-center gap-x-3 w-full pl-5 text-left text-lg font-light border-b-2 border-b-black p-2">
          <Link href={"/"}>
            <h3 className="transition hover:text-gray-300 cursor-pointer">
              Home /
            </h3>
          </Link>
          <Link href={`/product/${cate.id}`}>
            <h3 className="transition hover:text-gray-300 cursor-pointer">
              {cate.name} /
            </h3>
          </Link>
          {cate.sub && (
            <Link href={`/product/${cate.id}/${cate.sub.id}`}>
              {" "}
              <h3 className="transition hover:text-gray-300 cursor-pointer">
                {cate.sub.name} /
              </h3>{" "}
            </Link>
          )}
        </div>
        <div className="filter_container  min-w-[350px] h-[40px] mt-3 pl-5 flex flex-row gap-x-3 items-center ">
          <Selection
            default="Sort By"
            onChange={(e) =>
              setlistprodfil((prev) => ({
                ...prev,
                order: e.target.value,
              }))
            }
            data={[
              {
                label: "Low To High",
                value: 1,
              },
              {
                label: "High To Low",
                value: 0,
              },
            ]}
            style={{ height: "100%" }}
          />
          <PrimaryButton
            type="button"
            text={
              listproductfilter.color.length > 0 ||
              listproductfilter.size.length > 0
                ? "Filtered"
                : "Filter"
            }
            color={
              listproductfilter.color.length > 0 ||
              listproductfilter.size.length > 0
                ? "black"
                : "#495464"
            }
            width="100%"
            height="100%"
            radius="10px"
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, filteroption: true }))
            }
          />{" "}
        </div>
      </div>
      <div className="listproduct grid grid-cols-3 w-full h-full place-content-center mt-5 p-3">
        {allData.product.map((i, idx) => (
          <Card
            key={idx}
            name={i.name}
            price={i.price.toString()}
            img={i.covers}
            index={idx}
            discount={i.discount}
            stock={i.stock}
            id={i.id}
            isAdmin={false}
          />
        ))}
      </div>
      <PaginationComponent
        page={page}
        show={show}
        setpage={setpage}
        setshow={setshow}
        type="product"
      />
      {openmodal.filteroption && (
        <FilterMenu type="listproduct" totalproduct={totalprob} />
      )}{" "}
    </div>
  );
}
