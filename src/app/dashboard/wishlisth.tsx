import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { ProductState } from "@/src/context/GlobalType.type";
import { Badge, Button, Divider, Skeleton } from "@heroui/react";
import { memo, useCallback, useEffect, useState } from "react";
import Card from "../component/Card";

const WishlistTab = memo(() => {
  const { allData, setalldata } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [deleteId, setdeleteId] = useState<number[]>([]);
  const [editdata, seteditdata] = useState(false);

  useEffect(() => {
    const asyncFetchWishlist = async () => {
      const getReq = await ApiRequest({
        url: "/api/users?ty=wishlist",
        method: "GET",
      });
      if (getReq.success) {
        setalldata({ product: getReq.data as Array<ProductState> });
      }
    };
    Delayloading(asyncFetchWishlist, setloading, 500);
  }, []);

  const handleRemoveWishlist = useCallback((id: number) => {
    setdeleteId((prev) => [...prev, id]);
  }, []);

  const handleEdit = useCallback(async () => {
    if (editdata && deleteId.length > 0) {
      setloading(true);
      const delreq = await ApiRequest({
        url: "/api/users/info",
        method: "PUT",
        data: {
          ty: "wishlist",
          delwishlist: deleteId,
        },
      });
      setloading(false);
      if (delreq.success) {
        setalldata((prev) => ({
          product: prev?.product?.filter(
            (item) => !deleteId.includes(item.id as number)
          ),
        }));
        setdeleteId([]);
      }
    }
    seteditdata(!editdata);
  }, [deleteId, editdata, setalldata]);

  return (
    <div className="wishlisttab w-full h-fit">
      <h1 className="wishlist"> Wishlist </h1>
      <Divider />
      <Button
        onPress={handleEdit}
        style={editdata ? { backgroundColor: "lightcoral" } : {}}
        className="font-bold bg_default text-white w-[200px] h-[40px]"
      >
        {editdata ? `Delete ${deleteId.length} Item` : "Edit"}
      </Button>
      <div className="productlist w-full h-fit flex flex-row gap-5 flex-wrap">
        {loading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="w-[300px] h-[400px] rounded-md" />
          ))}
        {((!loading && !allData?.product) ||
          allData?.product?.length === 0) && <p>No Item Found</p>}

        {allData?.product?.map(
          (item, idx) =>
            item.id && (
              <Badge
                key={`wishlist ${idx}`}
                content={deleteId.includes(item.id) ? "Removing..." : "Remove"}
                color="danger"
                size="lg"
                onClick={() => item.id && handleRemoveWishlist(item.id)}
              >
                <Card
                  name={item.name}
                  price={item.price.toFixed(2)}
                  img={item.covers}
                  discount={item.discount}
                  width="300px"
                  height="400px"
                />
              </Badge>
            )
        )}
      </div>
    </div>
  );
});
WishlistTab.displayName = "WishlistTab";
export default WishlistTab;
