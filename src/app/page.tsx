"use server";

import { Metadata } from "next";
import {
  Banner,
  CategoryContainer,
  ScrollableContainer,
  SlideShow,
} from "./component/HomePage/Component";
import { GetContainers } from "./action";
import { Homeitemtype, ProductState } from "../context/GlobalType.type";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SrokSre Online Store. Quality Over Quantity",
    description: "Small Online Store Base in PhnomPenh Cambodia",
  };
}

export default async function Home() {
  const items = (await GetContainers()) as unknown as Homeitemtype[];

  return (
    <main className="Home__Container w-full h-full grid place-content-center gap-y-10 min-h-screen relative">
      <div className="w-[95vw] h-full flex flex-col items-center gap-y-5">
        {items?.map((i, idx) => {
          if (i.items && i.type === "banner") {
            const banner = i.items[0].banner;
            return (
              <Banner
                key={idx}
                data={{
                  image: {
                    url: banner?.Image.url ?? "",
                    name: banner?.Image.name ?? "",
                  },
                  name: i.name,
                  link: banner?.promotionId
                    ? `/product?promoid=${banner.promotionId}`
                    : banner?.parentcate_id ||
                      banner?.childcate_id ||
                      banner?.selecttedproduct_id
                    ? `/product${
                        banner.parentcate_id || banner.childcate_id
                          ? banner.parentcate_id
                            ? `?pid=${banner.parentcate_id}${
                                banner.childcate_id
                                  ? `&cid=${banner.childcate_id}`
                                  : ""
                              }`
                            : ""
                          : banner.selecttedproduct_id &&
                            banner?.selecttedproduct_id.length > 0
                          ? `/detail/${banner.selecttedproduct_id[0]}`
                          : ""
                      }`
                    : undefined,
                }}
              />
            );
          } else if (i.type === "slide") {
            return (
              <SlideShow
                key={idx}
                data={
                  i.items?.map((data) => ({
                    img: data.banner?.Image.url ?? "",
                    name: data.banner?.name,
                    link: data.banner?.promotionId
                      ? `/product?promoid=${data.banner.promotionId}`
                      : data.banner?.parentcate_id ||
                        data.banner?.childcate_id ||
                        (data.banner?.selecttedproduct_id &&
                          data.banner.selecttedproduct_id.length > 0)
                      ? `/product${
                          data.banner.parentcate_id || data.banner.childcate_id
                            ? data.banner.parentcate_id
                              ? `?pid=${data.banner.parentcate_id}${
                                  data.banner.childcate_id
                                    ? `&cid=${data.banner.childcate_id}`
                                    : ""
                                }`
                              : ""
                            : data.banner.selecttedproduct_id
                            ? `/detail/${data.banner.selecttedproduct_id[0]}`
                            : ""
                        }`
                      : undefined,
                  })) as never
                }
              />
            );
          } else if (i.type === "category") {
            return (
              <CategoryContainer
                key={idx}
                name={i.name}
                data={
                  i.items?.map((j) => ({
                    image: {
                      url: j.banner?.Image?.url ?? "",
                      name: j.banner?.Image.name ?? "",
                    },
                    name: j.banner?.name ?? "",
                    link:
                      j.banner?.parentcate_id ||
                      j.banner?.childcate_id ||
                      j.banner?.selecttedproduct_id
                        ? `/product${
                            j.banner.selecttedproduct_id &&
                            j.banner.selecttedproduct_id.length === 1
                              ? `/detail/${j.banner.selecttedproduct_id[0]}`
                              : ""
                          }${
                            j.banner.parentcate_id
                              ? `?pid=${j.banner.parentcate_id}${
                                  j.banner.childcate_id
                                    ? `&cid=${j.banner.childcate_id}`
                                    : ""
                                }`
                              : ""
                          }`
                        : "",
                  })) as never
                }
              />
            );
          } else {
            return (
              <ScrollableContainer
                key={idx}
                title={i.name}
                items={
                  (i.items
                    ?.filter((i) => i.product?.id)
                    .map((i) => i.product) ?? []) as unknown as ProductState[]
                }
              />
            );
          }
        })}
      </div>
    </main>
  );
}
