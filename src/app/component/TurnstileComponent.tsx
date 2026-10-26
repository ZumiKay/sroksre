"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { Ref } from "react";

export default function TurnstileContainer({
  setcaptchaValue,
  ref,
}: {
  setcaptchaValue: (value: string | null) => void;
  ref?: Ref<TurnstileInstance | undefined>;
}) {
  return (
    <div className="turnstile_container w-[80%] h-fit flex justify-center">
      <Turnstile
        ref={ref}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        onSuccess={(token) => setcaptchaValue(token)}
        onExpire={() => setcaptchaValue(null)}
        onError={() => setcaptchaValue(null)}
      />
    </div>
  );
}
