"use server";

import { Metadata } from "next";
import { Orderpricetype } from "../context/OrderContext";
import { fetchContainers, formatContainer } from "./api/home/route";
import {
  Banner,
  CategoryContainer,
  ScrollableContainer,
  SlideShow,
} from "./component/HomePage/Component";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SrokSre Online Store. Quality Over Quantity",
    description: "Small Online Store Base in Phnompenh Cambodia",
  };
}

const fetchhomeitems = async () => {
  const data = await fetchContainers("detail");
  const res = data.map((i) => formatContainer(i as any));

  return res;
};
export default async function Home() {
  const items = await fetchhomeitems();

  return (
    <main className="Home__Container w-full h-full grid place-content-center gap-y-10 min-h-screen relative">
      <div className="w-[95vw] h-full flex flex-col items-center gap-y-5">
        {items.map((i, idx) => {
          if (i.type === "banner") {
            const banner = i.items[0].item;
            return (
              <Banner
                key={idx}
                data={{
                  image: {
                    url: i.items[0].item.image?.url ?? "",
                    name: i.items[0].item.image?.name ?? "",
                  },
                  name: i.name,
                  link: i.items[0].item.link
                    ? `/product${
                        banner.parent_id || banner.child_id
                          ? banner.parent_id
                            ? `?pid=${banner.parent_id}${
                                banner.child_id ? `&cid=${banner.child_id}` : ""
                              }`
                            : ""
                          : banner.product_id
                          ? `/detail/${banner.product_id}`
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
                data={i.items.map((data) => ({
                  img: data.item.image?.url ?? "",
                  name: data.item.name,
                  link: data.item.link
                    ? `/product${
                        data.item.parent_id || data.item.child_id
                          ? data.item.parent_id
                            ? `?pid=${data.item.parent_id}${
                                data.item.child_id
                                  ? `&cid=${data.item.child_id}`
                                  : ""
                              }`
                            : ""
                          : data.item.product_id
                          ? `/detail/${data.item.product_id}`
                          : ""
                      }`
                    : undefined,
                }))}
              />
            );
          } else if (i.type === "category") {
            return (
              <CategoryContainer
                key={idx}
                name={i.name}
                data={i.items.map((i) => ({
                  image: {
                    url: i.item.image?.url ?? "",
                    name: i.item.image?.name ?? "",
                  },
                  name: i.item.name ?? "",
                  link: i.item.link
                    ? `/product${
                        i.item.parent_id
                          ? `?pid=${i.item.parent_id}${
                              i.item.child_id ? `&cid=${i.item.child_id}` : ""
                            }`
                          : ""
                      }`
                    : "",
                }))}
              />
            );
          } else {
            return (
              <ScrollableContainer
                key={idx}
                title={i.name}
                items={i.items
                  .filter((i) => i.item.id)
                  .map((prod) => ({
                    id: prod.item.id ?? 0,
                    name: prod.item.name ?? "",
                    img: {
                      url: prod.item.image?.url ?? "",
                      name: prod.item.image?.name ?? "",
                    },
                    price: prod.item.price as Orderpricetype,
                  }))}
              />
            );
          }
        })}
      </div>
    </main>
  );
}
