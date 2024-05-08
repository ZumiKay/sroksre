import { getUser } from "@/src/context/OrderContext";
import { PolicyButton, SidePolicyBar } from "./component";
import { Role } from "@prisma/client";

export default async function PrivacyandPolicy({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const user = await getUser();
  return (
    <div className="w-full h-fit">
      <SidePolicyBar isAdmin={user?.role === Role.ADMIN} />

      <div className="w-full content pl-[25%] pr-[10%] pt-5">
        <div className="w-full h-fit flex flex-row items-center justify-between">
          <h3 className="font-bold text-5xl">Terms and conditions</h3>
          <PolicyButton title="Edit" ty="edit" color="lightcoral" />
        </div>
        <p className="w-full font-normal text-sm h-fit break-words">
          {`These terms and conditions (together with the information and policies
          contained in the "Customer Service" pages on the website and any other
          documents referred in these terms and conditions) ("Terms and
          Conditions") set out the legal terms that apply to your use of our
          website http://www.farfetch.com, any of its sub-domains and any other
          websites operated by us or on our behalf and any mobile device
          application or desktop application developed by us or on our behalf
          (together, the "Websites" and “Website” being a reference to any one
          of them) and the other services that we provide (the "Services").
          Please read these Terms and Conditions carefully and make sure that
          you understand them before using the Services. Please note that by
          using the Services, you agree to be bound by these Terms and
          Conditions. If you do not accept these Terms and Conditions, you will
          not be able to use the Services and you should leave the Website
          immediately. If you continue to use the Website or if you order
          products, we will take this as your acceptance of these Terms and
          Conditions. 1) Understanding these Terms and Conditions When certain
          words and phrases are used in these Terms and Conditions, they have
          specific meanings (these are known as 'defined terms'). You can
          identify these defined terms because they start with capital letters
          (even if they are not at the start of a sentence). Where a defined
          term is used, it has the meaning given to it in the section of the
          Terms and Conditions where it was defined (you can find these meanings
          by looking at the sentence where the defined term is included in
          brackets and speech marks). When we refer to "FARFETCH", "we", "us" or
          "our", we mean FARFETCH UK Limited or, where relevant, its affiliates.
          Where we refer to "you" or "your" we mean you, the person using the
          Services. We have used headings to help you understand these Terms and
          Conditions and to easily locate information. These Terms and
          Conditions are only available in the English language. We will not
          file copies of the contracts between us and you relating to our supply
          of the Services, or between you and the Partners relating to the sale
          of the products, so we recommend that you print or save a copy of
          these 
          Terms and Conditions for your records (but please note that we
          may amend these Terms and Conditions from time to time so please check
          the Website regularly, and each time you use the Services to order
          products, to ensure you understand the legal terms which apply at that
          time).`}
        </p>
        <p className="w-full font-normal text-sm h-fit break-words">
          2) About us IMPORTANT: If you are purchasing products from any of the
          brands or boutiques listed at the end of section 20 below (“Selected
          Partners”), then additional or different terms may apply to you in
          this section. Please see section 20 below. We are FARFETCH UK Limited
          and, along with certain of our affiliates, we operate the Website.
          FARFETCH UK Limited is a company registered in England and Wales and
          our registered office is at The Bower, 211 Old Street, London, EC1V
          9NR. Our registered company number is 06400760 and our VAT number is
          GB 204 0769 35. We, along with certain of our affiliates, provide the
          services through the website. Further details of the services we
          provide are set out in section 3 below. When you purchase products
          using the website, you are purchasing them from the third party
          retailers ("Partner(s)") named on the Website. It is important that
          you understand that the contract for the purchase of the products is
          between you and the relevant Partner. We are acting as agent on behalf
          of the Partners, which are the principals. You are not purchasing the
          products from us. We are authorised by the relevant Partners to
          conclude the contract on their behalf but we are not a party to that
          contract and you are not purchasing the products from us. or through
          us as your agent. Further details about the products, the Partners and
          the contract between you and the Partners in relation to your purchase
          of the products are set out in sections 5, 6 and 7 below.
          Notwithstanding the above and any subsequent references to conclusion
          of contracts for the purchase of the products between you and the
          Partners, in some instances, when you purchase products using the
          website or app, you are purchasing them from a Farfetch entity and in
          those instances Farfetch is not acting as an agent for any Partner. In
          those instances, the contract for the purchase of the products is
          between you and the relevant Farfetch entity. We will inform you where
          Farfetch is the seller.
        </p>
      </div>
    </div>
  );
}
