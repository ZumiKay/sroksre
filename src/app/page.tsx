"use server";

import { Orderpricetype } from "../context/OrderContext";
import { fetchContainers, formatContainer } from "./api/home/route";
import {
  Banner,
  CategoryContainer,
  ScrollableContainer,
  SlideShow,
} from "./component/HomePage/Component";

const fetchhomeitems = async () => {
  const data = await fetchContainers("detail");
  const res = data.map((i) => formatContainer(i as any));

  return res;
};
export default async function Home() {
  const items = await fetchhomeitems();

  return (
    <main className="Home__Container w-full h-full grid place-content-center gap-y-10 min-h-screen">
      <div className="w-[95vw] h-full flex flex-col items-center gap-y-10">
        {items.map((i) => {
          if (i.type === "banner") {
            return (
              <Banner
                key={i.idx}
                data={{
                  image: {
                    url: i.items[0].item.image?.url ?? "",
                    name: i.items[0].item.image?.name ?? "",
                  },
                  name: i.name,
                }}
              />
            );
          } else if (i.type === "slide") {
            return (
              <SlideShow
                key={i.idx}
                data={i.items.map((data) => ({
                  img: data.item.image?.url ?? "",
                  name: data.item.name,
                }))}
              />
            );
          } else if (i.type === "category") {
            return (
              <CategoryContainer
                key={i.idx}
                name={i.name}
                data={i.items.map((i) => ({
                  image: {
                    url: i.item.image?.url ?? "",
                    name: i.item.image?.name ?? "",
                  },
                  name: i.item.name ?? "",
                  link: i.item.link,
                }))}
              />
            );
          } else {
            return (
              <ScrollableContainer
                key={i.idx}
                title={i.name}
                items={i.items.map((prod) => ({
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
