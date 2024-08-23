import ReCAPTCHA from "react-google-recaptcha";
import React from "react";

export default function RecapchaContainer({
  captchaValue,
  setcaptchaValue,
}: {
  captchaValue: string | null;
  setcaptchaValue: (value: string | null) => void;
}) {
  const handleRecapcha = (value: string | null) => {
    setcaptchaValue(value);
  };
  return (
    <div className="recapcha_container w-[80%] h-fit">
      <ReCAPTCHA
        sitekey={process.env.CAPTCHA_KEY ?? ""}
        onChange={handleRecapcha}
      />
    </div>
  );
}
