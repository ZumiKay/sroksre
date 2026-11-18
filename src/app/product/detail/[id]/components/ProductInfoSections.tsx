import { ProductInfo } from "@/src/types/product.type";

const infoText = (v: ProductInfo["info_value"][number]) =>
  typeof v === "string" ? v : v.val;

interface ProductInfoSectionsProps {
  description?: string | null;
  details: ProductInfo[];
  policies: Array<{
    id: number;
    title: string;
    Paragraph: Array<{ id?: number; title?: string | null; content: string }>;
  }>;
}

/**
 * Description, product details and store policies as collapsible sections
 * (native <details>, so it works without JavaScript and with the keyboard).
 */
export function ProductInfoSections({
  description,
  details,
  policies,
}: ProductInfoSectionsProps) {
  const rows = details.filter(
    (d) => d.info_title && d.info_value?.[0] !== undefined,
  );

  return (
    <div className="divide-y divide-gray-200 border-t border-gray-200">
      {description && (
        <InfoSection title="Description" defaultOpen>
          <p className="whitespace-pre-line wrap-break-word leading-relaxed text-gray-700">
            {description}
          </p>
        </InfoSection>
      )}

      {rows.length > 0 && (
        <InfoSection title="Product details">
          <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 gap-y-2 text-sm">
            {rows.map((row, idx) => (
              <div key={row.id ?? idx} className="contents">
                <dt className="text-gray-500">{row.info_title}</dt>
                <dd className="wrap-break-word font-medium text-gray-900">
                  {infoText(row.info_value[0])}
                </dd>
              </div>
            ))}
          </dl>
        </InfoSection>
      )}

      {policies.map((policy) => (
        <InfoSection key={policy.id} title={policy.title}>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-gray-700">
            {policy.Paragraph.map((para, idx) => (
              <div key={para.id ?? idx}>
                {para.title && (
                  <p className="font-semibold text-gray-900">{para.title}</p>
                )}
                <p className="whitespace-pre-line wrap-break-word">
                  {para.content}
                </p>
              </div>
            ))}
          </div>
        </InfoSection>
      ))}
    </div>
  );
}

const InfoSection = ({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => (
  <details open={defaultOpen} className="group py-1">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-gray-900 outline-none focus-visible:ring-4 focus-visible:ring-gray-300 rounded-md [&::-webkit-details-marker]:hidden">
      {title}
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
        className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </summary>
    <div className="pb-5">{children}</div>
  </details>
);
