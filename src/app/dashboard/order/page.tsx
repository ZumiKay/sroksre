import { Selection } from "../../component/Button";
import { SecondayCard } from "../../component/Card";
import Default from '../../Asset/Image/default.png'
type BuyerOrderStatus =
  | "Requested"
  | "Confirmed"
  | "Paid"
  | "Shipped"
  | "Arrived"
  | "Picked";
export default function Myorder() {
  return (
    <main className="order__container w-full flex flex-col items-center gap-y-20">
      <div className="order_header sticky top-[6vh] z-30 bg-white flex flex-row items-center justify-start gap-x-22 border-b-2 border-black w-full p-2">
        <div className="filter__section flex flex-row w-[30%]">
          <Selection default="Buy Products" />
          <Selection style={{marginLeft: "-150px"}} default="View" />
        </div>
        <div className="statusFilter__section flex flex-row items-center justify-start gap-x-32 w-1/2">
          <h3 className="status text-green-500 text-lg font-bold">Requested</h3>
          <h3 className="status text-green-500 text-lg font-bold">
            {" "}
            Confirmed{" "}
          </h3>{" "}
          <h3 className="status text-green-500 text-lg font-bold"> Shipped </h3>
          <h3 className="status text-green-500 text-lg font-bold"> Arrived </h3>
        </div>
      </div>

      <div className="products_list w-1/2 ">
        <SecondayCard img={Default} action={true} />
        <SecondayCard img={Default} action={true} />
        <SecondayCard img={Default} action={true} />
      </div>
    </main>
  );
}
