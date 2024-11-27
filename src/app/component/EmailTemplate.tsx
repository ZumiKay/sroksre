import {
  Orderpricetype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { OrderUserType } from "../checkout/action";
import { VariantColorValueType } from "@/src/context/GlobalContext";

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
  const price = orderProduct.price;
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
        details: orderProduct.selectedvariant as any,
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
        height: "auto",
        display: "grid",
        placeItems: "center",
        placeContent: "center",
      }}
    >
      <table
        className="Reciept_Contianer"
        style={{
          backgroundColor: "#f2f2f2",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          border: 0,
        }}
        align="center"
      >
        <tbody style={{ textAlign: "center", border: 0 }}>
          <tr></tr>
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
              <p style={{ fontSize: "20px", fontWeight: "700" }}>
                {isAdmin
                  ? `Order for ${order.user.firstname}#${order.user.id}`
                  : `Thank you for shopping with us`}
              </p>
            </td>
          </tr>

          <tr>
            <td
              height={"50px"}
              colSpan={2}
              style={{ textAlign: "left", paddingLeft: "5%", fontSize: "15px" }}
            >
              {!isAdmin && (
                <p style={{ height: "50px" }}>
                  <strong>{`Hi, ${order.user?.firstname ?? ""}`} </strong>
                  {"we received your order."}
                </p>
              )}
              <p
                style={{
                  fontSize: "25px",
                  fontWeight: 800,
                  height: "50px",
                }}
              >
                Order Summary
              </p>
              <p style={{ fontWeight: "700" }}>Order #: {order.id}</p>
              <p style={{ fontWeight: "700" }}>
                Order on {formatDate(order.createdAt)}
              </p>
              <p
                style={{
                  fontWeight: "700",
                  color: AllOrderStatusColor[order.status.toLowerCase()],
                }}
              >
                {`Order status: ${order.status.toUpperCase()}`}
              </p>

              {order.shipping && (
                <>
                  <p
                    style={{
                      fontSize: "25px",
                      fontWeight: 800,
                      height: "30px",
                    }}
                  >
                    Shipping Address
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    {`${order.shipping.firstname} ${order.shipping.lastname}`}
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    {`No${order.shipping.houseId}, Street ${order.shipping.street}`}{" "}
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  >
                    {`${order.shipping.district}, ${order.shipping.songkhat}`}{" "}
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    {`${order.shipping.province}, ${order.shipping.postalcode}`}{" "}
                  </p>
                </>
              )}
            </td>
          </tr>

          {order.Orderproduct.map((prob) => {
            return <ShowCard orderProduct={prob} />;
          })}

          <tr style={{ height: "70px", width: "100%" }}>
            <td colSpan={2} width={"95%"}>
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
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?q=${order.id}`}
              >
                View Order
              </a>
            </td>
          </tr>

          <TotalPrice data={order.price} />

          <tr style={{ width: "100%", height: "auto" }}>
            <td colSpan={2} align="left">
              <p style={{ fontWeight: 800, fontSize: "30px" }}>Need Help ?</p>
              <a
                style={{
                  fontSize: "25px",
                  fontWeight: "600",
                  padding: "10px",
                }}
                href={process.env.BASE_URL + "/contact"}
              >
                Contact
              </a>
            </td>
          </tr>

          <tr>
            <td colSpan={2} align="left">
              <a
                style={{
                  fontSize: "25px",
                  fontWeight: "600",
                  padding: "10px",
                }}
                href={process.env.NEXT_PUBLIC_BASE_URL + "/privacyandpolicy"}
              >
                Policy and Terms
              </a>
            </td>
          </tr>
          <tr>
            <td colSpan={2} align="left">
              <a
                style={{
                  fontSize: "25px",
                  fontWeight: "600",
                  padding: "10px",
                }}
                href={
                  process.env.NEXT_PUBLIC_BASE_URL + "/privacyandpolicy?p=0"
                }
              >
                FAQs
              </a>
            </td>
          </tr>

          <tr></tr>
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
  details: (string | VariantColorValueType)[];
  price: Orderpricetype;
  total: number;
}
const OrderProductEmailCard = ({ data }: { data: ProductEmailCardProps }) => {
  const isDiscount = data.price.discount;

  const ShowPrice = () => {
    return (
      <p>
        <span
          style={{
            textDecoration: isDiscount ? "line-through" : "none",
            color: "red",
            marginRight: "10px",
          }}
        >
          ${data.price.price}
        </span>
        {isDiscount && (
          <>
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
          width: "100%",
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
          {data.details.map((info, idx) =>
            typeof info === "string" ? (
              <p
                key={idx}
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
                {info}
              </p>
            ) : (
              <div
                key={idx}
                style={{
                  width: "150px",
                  maxWidth: "100%",
                  backgroundColor: "#f2f2f2",
                  borderRadius: "10px",
                  marginBottom: "10px",
                  padding: "5px",
                }}
              >
                <div
                  style={{
                    width: "25px",
                    height: "25px",
                    borderRadius: "100%",
                    backgroundColor: info.val,
                    display: "inline-block",
                    verticalAlign: "middle",
                  }}
                ></div>
                {info.name && (
                  <span
                    style={{
                      fontWeight: "normal",
                      display: "inline-block",
                      wordBreak: "break-all",
                      paddingLeft: "5px",
                    }}
                  >
                    {info.name}
                  </span>
                )}
              </div>
            )
          )}
        </td>
      </tr>
      <tr
        style={{
          backgroundColor: "white",
          width: "auto",
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
  const styles = {
    container: {
      width: "100%",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f4f4f4",
      padding: "20px",
      textAlign: "center" as const,
      height: "100vh",
    },
    table: {
      maxWidth: "600px",
      margin: "auto",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      overflow: "hidden",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      width: "100%",
      height: "100%",
    },
    tableCell: {
      padding: "20px",
      textAlign: "center" as const,
    },
    headerText: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333333",
      margin: 0,
    },
    promoContainer: {
      padding: "20px",
      backgroundColor: "#495464",
      textAlign: "center" as const,
      borderRadius: "5px",
    },
    promoText: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#ffffff",
      margin: 0,
      wordWrap: "break-word" as const,
    },
    promoLink: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#ffffff",
      textDecoration: "none",
      wordWrap: "break-word" as const,
    },
    warningText: {
      fontSize: "16px",
      color: "#333333",
      margin: 0,
      textAlign: "right" as const,
    },
    footerText: {
      fontSize: "14px",
      color: "#666666",
      textAlign: "right" as const,
    },
  };

  return (
    <div style={styles.container}>
      <table style={styles.table} cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          <tr>
            <td style={styles.tableCell}>
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064"
                width="100"
                height="auto"
                alt="Logo"
                style={{
                  display: "block",
                  margin: "auto",
                  objectFit: "contain",
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={styles.tableCell}>
              <p style={styles.headerText}>{message}</p>
            </td>
          </tr>
          <tr>
            <td style={styles.promoContainer}>
              {infotype === "code" ? (
                <p style={styles.promoText}>{infovalue}</p>
              ) : (
                <a href={infovalue} style={styles.promoLink}>
                  {infovalue}
                </a>
              )}
            </td>
          </tr>
          <tr>
            <td style={styles.warningText}>
              <p>{warn}</p>
            </td>
          </tr>
          <tr>
            <td style={styles.footerText}>
              <span>All rights reserved © SrokSre</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
