import { ReactNode } from "react";

export default function Productslayout(props: { children: ReactNode }) {
  return <section className="w-full">{props.children}</section>;
}
