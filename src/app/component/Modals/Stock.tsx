import {
  Productinitailizestate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { errorToast, successToast } from "../Loading";
import Modal from "../Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import PrimaryButton from "../Button";

export const UpdateStockModal = ({
  action,
  closename,
}: {
  action?: () => void;
  closename: string;
}) => {
  const {
    product,
    setproduct,
    setreloaddata,
    setopenmodal,
    isLoading,
    setisLoading,
  } = useGlobalContext();

  const handleUpdate = async () => {
    const update = await ApiRequest(
      "/api/products/crud",
      setisLoading,
      "PUT",
      "JSON",
      { stock: product.stock, id: product.id, type: "editstock" }
    );
    if (!update.success) {
      errorToast("Failed To Update Stock");
      return;
    }

    setproduct(Productinitailizestate);
    setreloaddata(true);
    successToast("Stock Updated");
    setopenmodal((prev) => ({ ...prev, [closename]: false }));
  };
  return (
    <Modal closestate={closename}>
      <div className="updatestock w-[100%] h-[100%] rounded-lg flex flex-col items-center justify-center gap-y-5 bg-white p-1">
        <label className="text-lg font-bold">Update Stock </label>
        <input
          type="number"
          placeholder="Stock"
          name="stock"
          min={0}
          max={1000}
          onChange={(e) => {
            const { value } = e.target;
            const val = parseInt(value);
            setproduct((prev) => ({ ...prev, stock: val }));
          }}
          value={product.stock}
          required
          className="w-[80%] h-[50px] text-lg pl-1 font-bold bg-[#D9D9D9] rounded-md "
        />
        <PrimaryButton
          color="#44C3A0"
          text="Update"
          type="button"
          onClick={() => handleUpdate()}
          radius="10px"
          status={isLoading.PUT ? "loading" : "authenticated"}
          width="80%"
          height="50px"
        />{" "}
        <PrimaryButton
          color="#F08080"
          text="Cancel"
          type="button"
          radius="10px"
          width="80%"
          height="50px"
          disable={isLoading.PUT}
          onClick={() => {
            setopenmodal((prev) => ({ ...prev, [closename]: false }));
          }}
        />
      </div>
    </Modal>
  );
};
