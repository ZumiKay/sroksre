import Image from "next/image";
import Logo from "../../../public/Image/Logo.svg";
import Link from "next/link";
import { getPolicesByPage } from "../api/policy/route";

const linkClass =
  "text-sm text-slate-600 transition-colors hover:text-slate-900 hover:underline underline-offset-4";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-900">{title}</h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const policies = await getPolicesByPage("footer");

  return (
    <footer className="footer__container mt-20 w-full bg-slate-50 border-t border-slate-200">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="footer__body grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
          {/* Brand */}
          <div className="footer__header col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" aria-label="Srok Sre home" className="w-fit">
              <Image className="logo w-24 h-auto object-contain" alt="Srok Sre" src={Logo} />
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Your trusted online store for quality products. Shop the latest collections.
            </p>
          </div>

          <FooterColumn
            title="Shop"
            links={[
              { href: "/product?all=1", label: "All products" },
              { href: "/account", label: "Login / Sign up" },
            ]}
          />

          <FooterColumn
            title="Help"
            links={[
              { href: "/contact", label: "Contact us" },
              { href: "/privacyandpolicy", label: "Privacy and policies" },
            ]}
          />

          <FooterColumn
            title="Support"
            links={policies.map((policy) => ({
              href: `/privacyandpolicy?p=${policy.id}`,
              label: policy.title,
            }))}
          />
        </div>

        <div className="mt-12 pt-6 border-t border-slate-300/70 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Srok Sre. All rights reserved.</p>
        </div>
      </div>
      {/* Room for the cookie banner so it doesn't cover the footer */}
      <div className="h-16" aria-hidden="true" />
    </footer>
  );
}
