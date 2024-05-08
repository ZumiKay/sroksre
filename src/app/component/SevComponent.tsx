"use server";

import ReactDomServer from "react-dom/server";
import { CredentialEmail } from "./EmailTemplate";
export const RenderCredentailEmailToString = async ({
  type,
  infovalue,
  message,
  warn,
}: {
  type: string;
  infovalue: string;
  message: string;
  warn: string;
}) => {
  return ReactDomServer.renderToString(
    <CredentialEmail
      infotype={type as any}
      infovalue={infovalue}
      message={message}
      warn={warn}
    />
  );
};
