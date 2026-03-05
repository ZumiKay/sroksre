import {
  Orderpricetype,
  OrderSelectedVariantType,
  Ordertype,
  Productordertype,
  totalpricetype,
} from "@/src/types/order.type";
import { VariantValueObjType } from "@/src/types/product.type";

const isOrderSelectedVariantType = (
  details: unknown,
): details is OrderSelectedVariantType =>
  !!details &&
  !Array.isArray(details) &&
  typeof details === "object" &&
  ("variantsection" in (details as object) || "variant" in (details as object));

interface OerderEmailProps {
  order: Ordertype;
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
  // Use stored price data — avoids depending on live product price
  const total =
    orderProduct.quantity * (price.discount?.newprice ?? price.price);

  return (
    <OrderProductEmailCard
      data={{
        cover: orderProduct.product?.covers[0].url as string,
        name: orderProduct.product?.name as string,
        quantity: orderProduct.quantity,
        details: orderProduct.selectedvariant,
        price,
        total,
      }}
    />
  );
};
export function OrderReceiptTemplate({ order, isAdmin }: OerderEmailProps) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px 0",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border={0}
        style={{
          maxWidth: "650px",
          width: "100%",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <tbody>
          {/* Logo Section */}
          <tr>
            <td
              colSpan={2}
              align="center"
              style={{
                padding: "40px 20px 20px",
                backgroundColor: "#495464",
              }}
            >
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sroksre-442c0.appspot.com/o/sideImage%2FLogo3.png?alt=media&token=e9bda37b-3cc7-400b-9680-01d3b2bf2064"
                width="120"
                height="auto"
                title="Logo"
                alt="SrokSre Logo"
                style={{
                  display: "block",
                  margin: "0 auto",
                  maxWidth: "120px",
                  height: "auto",
                }}
              />
            </td>
          </tr>

          {/* Header Message */}
          <tr>
            <td
              colSpan={2}
              align="center"
              style={{
                padding: "30px 20px 20px",
                backgroundColor: "#495464",
              }}
            >
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#ffffff",
                  margin: "0",
                  lineHeight: "1.4",
                }}
              >
                {isAdmin
                  ? `Order for ${order.user.firstname} #${order.user.id}`
                  : `Thank you for your order!`}
              </h1>
            </td>
          </tr>

          {/* Order Summary Section */}
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "30px 30px 10px",
                backgroundColor: "#ffffff",
              }}
            >
              {!isAdmin && (
                <p
                  style={{
                    fontSize: "16px",
                    color: "#333333",
                    margin: "0 0 20px",
                    lineHeight: "1.6",
                  }}
                >
                  <strong>Hi {order.user?.firstname ?? ""},</strong>
                  <br />
                  We've received your order and will process it shortly.
                </p>
              )}
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#333333",
                  margin: "0 0 20px",
                  borderBottom: "2px solid #495464",
                  paddingBottom: "10px",
                }}
              >
                Order Summary
              </h2>
              <table
                cellPadding="0"
                cellSpacing="0"
                border={0}
                style={{ width: "100%", marginBottom: "20px" }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        color: "#666666",
                      }}
                    >
                      <strong style={{ color: "#333333" }}>Order #:</strong>
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        color: "#333333",
                        textAlign: "right",
                      }}
                    >
                      {order.id}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        color: "#666666",
                      }}
                    >
                      <strong style={{ color: "#333333" }}>Order Date:</strong>
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        color: "#333333",
                        textAlign: "right",
                      }}
                    >
                      {order.createdAt
                        ? formatDate(order.createdAt)
                        : "Unknown"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        color: "#666666",
                      }}
                    >
                      <strong style={{ color: "#333333" }}>Status:</strong>
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: "15px",
                        fontWeight: "700",
                        color: AllOrderStatusColor[order.status.toLowerCase()],
                        textAlign: "right",
                        textTransform: "uppercase",
                      }}
                    >
                      {order.status}
                    </td>
                  </tr>
                </tbody>
              </table>

              {order.shipping && (
                <>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#333333",
                      margin: "20px 0 10px",
                    }}
                  >
                    Shipping Address
                  </h3>
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#f9f9f9",
                      borderRadius: "8px",
                      fontSize: "15px",
                      color: "#555555",
                      lineHeight: "1.6",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 5px",
                        fontWeight: "600",
                        color: "#333333",
                      }}
                    >
                      {`${order.shipping.firstname} ${order.shipping.lastname}`}
                    </p>
                    <p style={{ margin: "0 0 5px" }}>
                      {`No. ${order.shipping.houseId}, Street ${order.shipping.street}`}
                    </p>
                    <p style={{ margin: "0 0 5px" }}>
                      {`${order.shipping.district}, ${order.shipping.songkhat}`}
                    </p>
                    <p style={{ margin: "0" }}>
                      {`${order.shipping.province}, ${order.shipping.postalcode}`}
                    </p>
                  </div>
                </>
              )}
            </td>
          </tr>

          {/* Products Header */}
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "20px 30px 10px",
                backgroundColor: "#ffffff",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#333333",
                  margin: "0",
                }}
              >
                Order Items
              </h3>
            </td>
          </tr>

          {order.Orderproduct.map((prob, index) => (
            <ShowCard key={index} orderProduct={prob} />
          ))}

          <TotalPrice data={order.price} />

          {/* View Order Button */}
          <tr>
            <td
              colSpan={2}
              align="center"
              style={{
                padding: "30px 30px 20px",
                backgroundColor: "#ffffff",
              }}
            >
              <a
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/order?q=${order.id}`}
                style={{
                  display: "inline-block",
                  padding: "14px 40px",
                  backgroundColor: "#495464",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "16px",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background-color 0.3s ease",
                }}
              >
                View Full Order Details
              </a>
            </td>
          </tr>

          {/* Footer Section */}
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "30px 30px 20px",
                backgroundColor: "#f9f9f9",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#333333",
                  margin: "0 0 15px",
                }}
              >
                Need Help?
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "0 0 15px",
                  lineHeight: "1.6",
                }}
              >
                If you have any questions about your order, feel free to reach
                out to us.
              </p>
              <table
                cellPadding="0"
                cellSpacing="0"
                border={0}
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "5px 0" }}>
                      <a
                        href={process.env.NEXT_PUBLIC_BASE_URL + "/contact"}
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#495464",
                          textDecoration: "none",
                        }}
                      >
                        → Contact Support
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0" }}>
                      <a
                        href={
                          process.env.NEXT_PUBLIC_BASE_URL +
                          "/privacyandpolicy?p=0"
                        }
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#495464",
                          textDecoration: "none",
                        }}
                      >
                        → FAQs
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "5px 0" }}>
                      <a
                        href={
                          process.env.NEXT_PUBLIC_BASE_URL + "/privacyandpolicy"
                        }
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#495464",
                          textDecoration: "none",
                        }}
                      >
                        → Privacy Policy & Terms
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Copyright */}
          <tr>
            <td
              colSpan={2}
              align="center"
              style={{
                padding: "20px 30px",
                backgroundColor: "#f9f9f9",
                fontSize: "13px",
                color: "#999999",
              }}
            >
              <p style={{ margin: "0" }}>
                © {new Date().getFullYear()} SrokSre. All rights reserved.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const TotalPrice = ({ data }: { data: totalpricetype }) => {
  const rowStyle = {
    label: {
      padding: "7px 0",
      fontSize: "14px",
      color: "#666666",
      textAlign: "left" as const,
    },
    value: {
      padding: "7px 0",
      fontSize: "14px",
      color: "#333333",
      textAlign: "right" as const,
      fontWeight: "500" as const,
    },
  };

  return (
    <>
      {/* Divider */}
      <tr>
        <td
          colSpan={2}
          style={{ padding: "4px 30px", backgroundColor: "#ffffff" }}
        >
          <div style={{ borderTop: "1px solid #e0e0e0", margin: "16px 0 0" }} />
        </td>
      </tr>

      {/* Summary table */}
      <tr>
        <td
          colSpan={2}
          style={{
            padding: "0 30px 24px",
            backgroundColor: "#ffffff",
          }}
        >
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            style={{
              width: "100%",
              maxWidth: "320px",
              marginLeft: "auto",
            }}
          >
            <tbody>
              {/* Subtotal */}
              <tr>
                <td style={rowStyle.label}>Subtotal</td>
                <td style={rowStyle.value}>${data.subtotal.toFixed(2)}</td>
              </tr>

              {/* Shipping */}
              <tr>
                <td style={rowStyle.label}>Shipping</td>
                <td style={rowStyle.value}>
                  {data.shipping && data.shipping > 0
                    ? `$${data.shipping.toFixed(2)}`
                    : "Free"}
                </td>
              </tr>

              {/* VAT (only if present) */}
              {data.vat !== undefined && data.vat > 0 && (
                <tr>
                  <td style={rowStyle.label}>VAT</td>
                  <td style={rowStyle.value}>${data.vat.toFixed(2)}</td>
                </tr>
              )}

              {/* Total */}
              <tr>
                <td
                  style={{
                    padding: "12px 0 0",
                    fontSize: "17px",
                    fontWeight: "800",
                    color: "#1a1a1a",
                    borderTop: "2px solid #333333",
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    padding: "12px 0 0",
                    fontSize: "17px",
                    fontWeight: "800",
                    color: "#0097FA",
                    textAlign: "right" as const,
                    borderTop: "2px solid #333333",
                  }}
                >
                  ${data.total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </>
  );
};

interface ProductEmailCardProps {
  cover: string;
  name: string;
  quantity: number;
  details?: Array<string | VariantValueObjType> | OrderSelectedVariantType;
  price: Orderpricetype;
  total: number;
}

/** Renders a single variant chip (string or colour object) for email */
const EmailVariantChip = ({
  info,
  idx,
}: {
  info: string | VariantValueObjType;
  idx: number;
}) => (
  <span
    key={idx}
    style={{
      display: "inline-block",
      backgroundColor: "#ffffff",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      color: "#555555",
      marginRight: "6px",
      marginBottom: "6px",
      border: "1px solid #d0d0d0",
      whiteSpace: "nowrap" as const,
    }}
  >
    {typeof info !== "string" && info.val && (
      <span
        style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: info.val,
          border: "1px solid #bbbbbb",
          verticalAlign: "middle",
          marginRight: "5px",
        }}
      />
    )}
    <span style={{ verticalAlign: "middle" }}>
      {typeof info === "string" ? info : info.name}
    </span>
  </span>
);

/** Renders variant details supporting both flat array and sectioned OrderSelectedVariantType */
const EmailVariantDetails = ({
  details,
}: {
  details?: Array<string | VariantValueObjType> | OrderSelectedVariantType;
}) => {
  if (!details) return null;

  if (isOrderSelectedVariantType(details)) {
    const hasSections =
      details.variantsection && details.variantsection.length > 0;
    const hasFlat = details.variant && details.variant.length > 0;
    if (!hasSections && !hasFlat) return null;

    return (
      <>
        {details.variantsection?.map((section, sIdx) => (
          <div key={sIdx} style={{ marginBottom: "8px" }}>
            {section.variantSection?.name && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#888888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "4px",
                }}
              >
                {section.variantSection.name}
              </div>
            )}
            <div>
              {section.variants.map((item, idx) => (
                <EmailVariantChip key={idx} info={item} idx={idx} />
              ))}
            </div>
          </div>
        ))}
        {hasFlat && (
          <div style={{ marginBottom: "8px" }}>
            {details.variant!.map((item, idx) => (
              <EmailVariantChip key={idx} info={item} idx={idx} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (Array.isArray(details) && details.length > 0) {
    return (
      <div style={{ marginBottom: "8px" }}>
        {details.map((item, idx) => (
          <EmailVariantChip key={idx} info={item} idx={idx} />
        ))}
      </div>
    );
  }

  return null;
};

const OrderProductEmailCard = ({ data }: { data: ProductEmailCardProps }) => {
  const discount = data.price.discount;
  const basePrice = parseFloat(data.price.price.toString()).toFixed(2);
  const effectivePrice = discount
    ? parseFloat((discount.newprice ?? data.price.price).toString()).toFixed(2)
    : basePrice;

  return (
    <tr>
      <td
        colSpan={2}
        style={{ padding: "6px 30px", backgroundColor: "#ffffff" }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          border={0}
          style={{
            width: "100%",
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            border: "1px solid #e8e8e8",
            overflow: "hidden",
          }}
        >
          <tbody>
            <tr>
              {/* Product image */}
              <td
                style={{
                  width: "110px",
                  padding: "16px",
                  verticalAlign: "middle",
                }}
              >
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  <img
                    alt={data.name}
                    title={data.name}
                    width="90"
                    height="90"
                    style={{
                      width: "90px",
                      height: "90px",
                      objectFit: "contain",
                      display: "block",
                    }}
                    src={data.cover}
                  />
                </div>
              </td>

              {/* Product details */}
              <td
                style={{
                  padding: "16px 16px 16px 0",
                  verticalAlign: "top",
                }}
              >
                {/* Name */}
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    margin: "0 0 8px",
                    lineHeight: "1.4",
                  }}
                >
                  {data.name}
                </h4>

                {/* Variant chips */}
                <EmailVariantDetails details={data.details} />

                {/* Price row */}
                <table
                  cellPadding="0"
                  cellSpacing="0"
                  border={0}
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    borderTop: "1px solid #e0e0e0",
                    paddingTop: "10px",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: "middle" }}>
                        {/* Original price (strikethrough if discounted) */}
                        {discount && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#aaaaaa",
                              textDecoration: "line-through",
                              marginRight: "6px",
                            }}
                          >
                            ${basePrice}
                          </span>
                        )}
                        {/* Discount badge */}
                        {discount && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#ffffff",
                              backgroundColor: "#EB5757",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              marginRight: "6px",
                            }}
                          >
                            -{discount.percent ?? 0}%
                          </span>
                        )}
                        {/* Effective unit price */}
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#333333",
                            marginRight: "4px",
                          }}
                        >
                          ${effectivePrice}
                        </span>
                        <span style={{ fontSize: "13px", color: "#888888" }}>
                          × {data.quantity}
                        </span>
                      </td>
                      <td
                        style={{ textAlign: "right", verticalAlign: "middle" }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "800",
                            color: "#0097FA",
                          }}
                        >
                          ${data.total.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
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
