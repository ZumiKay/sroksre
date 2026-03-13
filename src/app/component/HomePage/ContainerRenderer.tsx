import { Orderpricetype } from "@/src/types/order.type";
import {
  Banner,
  CategoryContainer,
  ScrollableContainer,
  SlideShow,
} from "./Component";
import { GetChildCategoriesByPromotionId } from "./Actions";

interface ContainerItem {
  type: string;
  name: string;
  items: Array<{
    item: {
      id?: number;
      name?: string;
      image?: { url: string; name: string };
      price?: Orderpricetype;
      promotionId?: string;
      parent_id?: string;
      child_id?: string;
      product_id?: string;
    };
  }>;
}

async function buildProductLink(item: ContainerItem["items"][0]["item"]) {
  if (item.promotionId) {
    const childCat = await GetChildCategoriesByPromotionId(
      parseInt(item.promotionId),
    );
    if (childCat?.parentcategoriesId) {
      const params = new URLSearchParams();
      params.set("pid", childCat.parentcategoriesId.toString());
      params.set("cid", childCat.id.toString());
      return `/product?${params.toString()}`;
    }
    return `/product?promoid=${item.promotionId}`;
  }

  if (item.product_id) {
    return `/product/detail/${item.product_id}`;
  }

  if (item.parent_id || item.child_id) {
    const params = new URLSearchParams();
    if (item.parent_id) params.set("pid", item.parent_id);
    if (item.child_id) params.set("cid", item.child_id);
    return `/product?${params.toString()}`;
  }

  return undefined;
}

async function renderBanner(container: ContainerItem, idx: number) {
  const banner = container.items[0]?.item;
  if (!banner) return null;

  return (
    <Banner
      key={idx}
      data={{
        image: {
          url: banner.image?.url ?? "",
          name: banner.image?.name ?? "",
        },
        name: container.name,
        link: await buildProductLink(banner),
      }}
    />
  );
}

async function renderSlideShow(container: ContainerItem, idx: number) {
  const items = await Promise.all(
    container.items.map(async (data) => ({
      img: data.item.image?.url ?? "",
      name: data.item.name ?? "",
      link: await buildProductLink(data.item),
    })),
  );
  return <SlideShow key={idx} data={items} />;
}

async function renderCategoryContainer(container: ContainerItem, idx: number) {
  const data = await Promise.all(
    container.items.map(async (i) => ({
      image: {
        url: i.item.image?.url ?? "",
        name: i.item.image?.name ?? "",
      },
      name: i.item.name ?? "",
      link: (await buildProductLink(i.item)) ?? "",
    })),
  );
  return <CategoryContainer key={idx} name={container.name} data={data} />;
}

function renderScrollableContainer(container: ContainerItem, idx: number) {
  return (
    <ScrollableContainer
      key={idx}
      title={container.name}
      items={container.items
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

export async function ContainerRenderer({
  container,
  idx,
}: {
  container: ContainerItem;
  idx: number;
}) {
  switch (container.type) {
    case "banner":
      return renderBanner(container, idx);
    case "slide":
      return renderSlideShow(container, idx);
    case "category":
      return renderCategoryContainer(container, idx);
    default:
      return renderScrollableContainer(container, idx);
  }
}
