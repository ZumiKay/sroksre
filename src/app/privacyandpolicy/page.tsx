import { getUser } from "@/src/context/OrderContext";
import { PolicyButton, QuestionCard, SidePolicyBar } from "./component";

import {
  Addpolicytype,
  Addquestiontype,
  getAllPolicy,
  getPolicyById,
} from "./action";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LoadingIcon from "../component/Loading";
import { Props } from "../product/page";
import { Metadata } from "next";
import Prisma from "@/src/lib/prisma";

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { p } = searchParams;
  const page = p ? parseInt(p.toString()) : undefined;

  if (!page && page !== 0) {
    return {
      title: "Policy And Privacy Information | SrokSre",
      description:
        "Shipping Policy , Return Policy , FAQs , Frequently Ask Question",
    };
  }

  if (page === 0) {
    return {
      title: "Frequent Ask Question | SrokSre",
      description:
        "Question Frequent Asked By Custommer Through Our Email Or Contact",
    };
  }
  let title = "";

  const policy = await Prisma.policy.findUnique({ where: { id: page } });

  if (policy) {
    title = `${policy.title} | SrokSre`;
  }

  return { title: title, description: "Policy in our online store" };
}

export default async function PrivacyandPolicy({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const params = searchParams;
  const pageId = params?.p ? parseInt(params.p) : undefined;
  const user = await getUser();

  const allpolicy = await getAllPolicy();
  let policy: Addpolicytype | Addquestiontype[] | null = null;

  if (pageId || pageId === 0) {
    policy = (await getPolicyById(pageId)) as any;

    if (!policy) {
      return notFound();
    }
  }

  const ShowTitle = () => {
    const title =
      pageId === 0
        ? "FAQs (Frequent Ask Question)"
        : policy
        ? "title" in policy
          ? policy.title
          : undefined
        : undefined;

    return (
      <h3 className="font-bold text-5xl w-[95%] max-small_phone:w-[90%] break-words">
        {title}
      </h3>
    );
  };

  return (
    <div className="w-full min-h-screen">
      <SidePolicyBar
        isAdmin={user?.role === "ADMIN"}
        data={[
          { id: 0, content: "FAQs" },
          ...allpolicy.map((i) => ({ id: i.id, content: i.title })),
        ]}
      />
      <div className="w-full content max-smallest_screen:pl-[5%] pl-[25%] pr-[10%] pt-5">
        {!params?.p ? (
          <>
            <h2 className="text-5xl font-bold w-full">
              Policies and More Informations
            </h2>
          </>
        ) : (
          <>
            <div className="w-full h-fit flex flex-col items-start gap-y-5 mb-10">
              <ShowTitle />
              {pageId !== 0 && user && user.role === "ADMIN" && (
                <div className="w-full overflow-x-auto">
                  <div className="w-full min-w-[280px] h-[40px] flex flex-row gap-6 items-center justify-start">
                    <PolicyButton
                      title="Edit"
                      ty="edit"
                      color="#4688A0"
                      policydata={policy as Addpolicytype}
                    />
                    <PolicyButton
                      title="Show"
                      ty="showtype"
                      color="black"
                      showtype={(policy as Addpolicytype).showtype}
                      pid={pageId}
                    />
                    <PolicyButton
                      title="Delete"
                      ty="delete"
                      color="lightcoral"
                      pid={pageId}
                    />
                  </div>
                </div>
              )}
            </div>

            <Suspense fallback={<LoadingIcon />}>
              {pageId !== 0 ? (
                <PolicyContent
                  paragrah={policy as Addpolicytype}
                  isAdmin={user?.role === "ADMIN"}
                />
              ) : (
                <PolicyContent
                  question={policy as Addquestiontype[]}
                  isAdmin={user?.role === "ADMIN"}
                />
              )}
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}

interface Policycontent {
  paragrah?: Addpolicytype;
  question?: Addquestiontype[];
  isAdmin?: boolean;
}

const PolicyContent = ({ paragrah, question, isAdmin }: Policycontent) => {
  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      {paragrah ? (
        paragrah.Paragraph.map((i) => (
          <div className="w-full h-fit flex flex-col gap-5">
            {i.title && <h3 className="text-xl font-bold">{i.title}</h3>}
            <p
              key={i.id}
              className="w-full font-normal text-lg h-fit break-words"
            >
              {i.content}
            </p>
          </div>
        ))
      ) : (
        <>
          {!question?.length && (
            <h3 className="font-bold text-lg text-red-500">No question</h3>
          )}
          {question?.map((q, idx) => (
            <QuestionCard
              key={idx}
              isAdmin={isAdmin}
              isEdit={true}
              idx={idx}
              data={q}
            />
          ))}
        </>
      )}
    </div>
  );
};
