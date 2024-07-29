import {
  Orderpricetype,
  Productorderdetailtype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { OrderUserType } from "../checkout/action";

interface OerderEmailProps {
  order: OrderUserType;
  isAdmin: boolean;
}

const AllOrderStatusColor: { [key: string]: string } = {
  incart: "#495464",
  unpaid: "#EB5757",
  paid: "#35C191",
  preparing: "#0097FA",
  shipped: "#60513C",
  arrived: "#35C191",
};

export function formatDate(date: Date) {
  // Ensure date is valid
  if (!(date instanceof Date && !isNaN(date as any))) {
    throw new Error("Invalid Date object");
  }

  // Get date components
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  // Get time components
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  // Construct formatted date string
  const formattedDate = `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}${ampm}`;

  return formattedDate;
}

const ShowCard = ({ orderProduct }: { orderProduct: Productordertype }) => {
  const price = orderProduct.product?.price as unknown as Orderpricetype;
  const isDiscount = price.discount;

  const Totalprice =
    orderProduct.quantity *
    (!isDiscount
      ? orderProduct.product?.price ?? 0
      : (price.discount?.newprice as number));

  return (
    <OrderProductEmailCard
      data={{
        cover: orderProduct.product?.covers[0].url as string,
        name: orderProduct.product?.name as string,
        quantity: orderProduct.quantity,
        details: orderProduct.details,
        price: price,
        total: Totalprice,
      }}
    />
  );
};
export function OrderReceiptTemplate({ order, isAdmin }: OerderEmailProps) {
  return (
    <div
      style={{
        width: "100%",
        display: "grid",
        placeItems: "center",
      }}
    >
      <table
        className="Reciept_Contianer"
        style={{
          backgroundColor: "#f2f2f2",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "30%",
          minWidth: "450px",
          height: "100%",
          border: 0,
        }}
        align="center"
      >
        <tbody style={{ textAlign: "center", border: 0 }}>
          <tr>
            <td colSpan={2} align="center">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064"
                width={"100px"}
                height={"auto"}
                title="Logo"
                alt="Logo"
                loading="eager"
                style={{ display: "block", objectFit: "contain" }}
              />
            </td>
          </tr>

          <tr>
            <td colSpan={2} height={"100px"} valign="middle">
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>
                {isAdmin
                  ? `Order for ${order.user.firstname}`
                  : `Thank you for shopping with us`}
              </h3>
            </td>
          </tr>

          <tr>
            <td
              height={"50px"}
              colSpan={2}
              style={{ textAlign: "left", paddingLeft: "5%", fontSize: "15px" }}
            >
              {!isAdmin && (
                <h3>
                  <strong> Hi, {order.user.firstname} </strong> we received your
                  order and is processing for shipping
                </h3>
              )}
              <h3 style={{ fontWeight: "700" }}>Order #: {order.id}</h3>
              <h3 style={{ fontWeight: "700" }}>
                Order on {formatDate(order.createdAt)}
              </h3>
              <h3
                style={{
                  fontWeight: "700",
                  color: AllOrderStatusColor[order.status.toLowerCase()],
                }}
              >
                {`Order status: ${order.status.toUpperCase()}`}
              </h3>
            </td>
          </tr>
          <tr style={{ height: "20px" }}>
            <td></td>
          </tr>
          {order.Orderproduct.map((prob) => {
            return <ShowCard orderProduct={prob} />;
          })}

          <tr style={{ height: "70px", width: "100%" }}>
            <td colSpan={isAdmin ? 2 : 1} width={isAdmin ? "100%" : "50%"}>
              <a
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#495464",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "17px",
                  border: "0px",
                }}
                href={`${process.env.BASE_URL}/dashboard/order?q=${order.id}`}
              >
                View Order
              </a>
            </td>
            {!isAdmin && (
              <td width={"50%"}>
                <a
                  style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#495464",
                    border: "0px",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "17px",
                    fontWeight: "600",
                  }}
                  href={process.env.BASE_URL}
                >
                  Contiue Shopping
                </a>
              </td>
            )}
          </tr>

          <TotalPrice data={order.price} />
        </tbody>
      </table>
    </div>
  );
}

const TotalPrice = ({ data }: { data: totalpricetype }) => {
  return (
    <>
      <tr>
        <td
          colSpan={2}
          width={"100%"}
          style={{ borderTop: "2px dashed black" }}
        ></td>
      </tr>
      <tr style={{ fontSize: "15px" }}>
        <td style={{ textAlign: "left", paddingLeft: "10px" }}>Subtotal: </td>
        <td style={{ textAlign: "right", paddingRight: "10px" }}>
          ${data.subtotal.toFixed(2)}{" "}
        </td>
      </tr>
      <tr style={{ fontSize: "15px" }}>
        <td style={{ textAlign: "left", paddingLeft: "10px" }}>Shipping: </td>
        <td style={{ textAlign: "right", paddingRight: "10px" }}>
          ${data.shipping?.toFixed(2) ?? "0.00"}{" "}
        </td>
      </tr>
      <tr style={{ fontSize: "20px", fontWeight: "700" }}>
        <td style={{ textAlign: "left", paddingLeft: "10px" }}>Total: </td>
        <td style={{ textAlign: "right", paddingRight: "10px" }}>
          ${data.total.toFixed(2)}{" "}
        </td>
      </tr>
    </>
  );
};

interface ProductEmailCardProps {
  cover: string;
  name: string;
  quantity: number;
  details: Productorderdetailtype[];
  price: Orderpricetype;
  total: number;
}
const OrderProductEmailCard = ({ data }: { data: ProductEmailCardProps }) => {
  const isDiscount = data.price.discount;

  const ShowPrice = () => {
    return (
      <p>
        {isDiscount && (
          <>
            <span
              style={{
                textDecoration: "line-through",
                color: "red",
                marginRight: "10px",
              }}
            >
              ${data.price.price}
            </span>
            <span style={{ color: "red", marginRight: "10px" }}>
              -{isDiscount.percent ?? "0.00"}%
            </span>
            <span style={{ marginRight: "10px" }}>
              ${isDiscount.newprice?.toFixed(2)}
            </span>
          </>
        )}

        <span>X {data.quantity}</span>
      </p>
    );
  };
  return (
    <>
      <tr
        style={{
          height: "100%",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "10px",
          border: 0,
        }}
      >
        <td style={{ verticalAlign: "middle", border: 0 }}>
          <img
            alt="cover"
            title="cover"
            width={"150px"}
            style={{ objectFit: "cover", borderRadius: "10px" }}
            src={data.cover}
          />
        </td>
        <td style={{ verticalAlign: "top", textAlign: "left", border: 0 }}>
          <p style={{ fontWeight: "700" }}>{data.name}</p>
          {data.details
            .filter((i) => i.option_type !== "COLOR")
            .map((info) => (
              <p
                key={info.id}
                style={{
                  backgroundColor: "#f2f2f2",
                  width: "150px",
                  height: "fit-content",
                  padding: "5px",
                  borderRadius: "10px",
                  wordBreak: "break-all",
                  marginBottom: "10px",
                }}
              >
                {info.option_value}
              </p>
            ))}

          {data.details
            .filter((i) => i.option_type === "COLOR")
            .map((color) => (
              <div
                key={color.id}
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "100%",
                  backgroundColor: color.option_value,
                  marginBottom: "10px",
                }}
              ></div>
            ))}
        </td>
      </tr>
      <tr
        style={{
          backgroundColor: "white",
          fontWeight: "600",
          fontSize: "16px",
          border: 0,
        }}
      >
        <td align="left">
          <ShowPrice />
        </td>
        <td align="right">
          <p>${data.total.toFixed(2)}</p>
        </td>
      </tr>
      <tr style={{ height: "20px" }}>
        <td></td>
      </tr>
    </>
  );
};

export function CredentialEmail({
  message,
  infotype,
  infovalue,
  warn,
}: {
  message: string;
  infotype: "code" | "link";
  infovalue: string;
  warn: string;
}) {
  return (
    <div className="tableWrapper" style={{ width: "100%" }}>
      <table
        className="info_table"
        style={{
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "30%",
          minWidth: "450px",
          height: "100%",
          border: 0,
        }}
        align="center"
      >
        <tbody>
          <tr>
            <td colSpan={2} align="center">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064"
                width={"100px"}
                height={"auto"}
                title="Logo"
                alt="Logo"
                loading="eager"
                style={{ display: "block", objectFit: "contain" }}
              />
            </td>
          </tr>
          <tr style={{ height: "50px" }}>
            <td></td>
          </tr>
          <tr>
            <td>
              <h3 style={{ fontWeight: "600", fontSize: "20px" }}>{message}</h3>
            </td>
          </tr>
          <tr style={{ height: "50px" }}>
            <td></td>
          </tr>
          <tr
            style={{
              backgroundColor: "#495464",
              height: "200px",
              width: "100%",
            }}
          >
            <td style={{ borderRadius: "20px" }} align="center">
              {infotype === "code" ? (
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "white",
                    wordBreak: "break-all",
                  }}
                >
                  {infovalue}
                </h3>
              ) : (
                <a
                  style={{
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "white",
                    wordBreak: "break-all",
                  }}
                  href={infovalue}
                >
                  {infovalue}
                </a>
              )}
            </td>
          </tr>
          <tr style={{ height: "50px" }}>
            <td></td>
          </tr>
          <tr>
            <td align="right">
              <h3>{warn}</h3>
            </td>
          </tr>
          <tr>
            <td align="right">
              <span>All right reserve@ SrokSre</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
