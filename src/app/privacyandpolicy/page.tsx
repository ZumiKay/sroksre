import { getUser } from "@/src/lib/session";
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
import { Metadata } from "next";
import Prisma from "@/src/lib/prisma";
import { Role } from "@/prisma/generated/prisma/enums";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const { p } = resolvedSearchParams;
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
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const pageId = params?.p ? parseInt(params.p) : undefined;
  const user = await getUser({ user: { select: { role: true } } });

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
        ? "FAQs"
        : policy
          ? "title" in policy
            ? policy.title
            : undefined
          : undefined;

    return (
      <div className="flex flex-col gap-y-1">
        {pageId === 0 && (
          <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Support
          </span>
        )}
        <h3 className="font-bold text-4xl text-gray-900 wrap-break-word">
          {title}
        </h3>
        {pageId === 0 && (
          <p className="text-gray-500 text-base mt-1">
            Answers to the most common questions from our customers.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <SidePolicyBar
        isAdmin={user?.user.role === Role.ADMIN}
        data={[
          { id: 0, content: "FAQs" },
          ...allpolicy.map((i) => ({ id: i.id, content: i.title })),
        ]}
      />
      <div className="w-full content max-smallest_screen:pl-[5%] pl-[25%] pr-[10%] pt-10 pb-16">
        {!params?.p ? (
          <div className="w-full flex flex-col gap-y-4 py-8">
            <span className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Legal & Help
            </span>
            <h2 className="text-4xl font-bold text-gray-900">
              Policies & Information
            </h2>
            <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
              Everything you need to know about how we operate — from shipping
              and returns to frequently asked questions.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 max-w-2xl">
              {allpolicy.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  <p className="font-semibold text-gray-800">{p.title}</p>
                </div>
              ))}
              <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <p className="font-semibold text-gray-800">
                  FAQs — Frequently Asked Questions
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-y-8">
            <div className="w-full flex flex-col gap-y-4">
              <ShowTitle />
              {pageId !== 0 && user && user.role === "ADMIN" && (
                <div className="w-full overflow-x-auto">
                  <div className="w-fit min-w-[280px] flex flex-row gap-3 items-center px-4 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <PolicyButton
                      title="Edit"
                      ty="edit"
                      color="#4688A0"
                      policydata={policy as Addpolicytype}
                    />
                    <div className="w-px h-5 bg-gray-200" />
                    <PolicyButton
                      title="Visibility"
                      ty="showtype"
                      color="#6b7280"
                      showtype={(policy as Addpolicytype).showtype}
                      pid={pageId}
                    />
                    <div className="w-px h-5 bg-gray-200" />
                    <PolicyButton
                      title="Delete"
                      ty="delete"
                      color="#ef4444"
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
                  isAdmin={user?.user.role === Role.ADMIN}
                />
              ) : (
                <PolicyContent
                  question={policy as Addquestiontype[]}
                  isAdmin={user?.user.role === Role.ADMIN}
                />
              )}
            </Suspense>
          </div>
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
    <div className="w-full h-fit flex flex-col gap-y-4">
      {paragrah ? (
        paragrah.Paragraph.map((i) => (
          <div
            key={i.id}
            className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3"
          >
            {i.title && (
              <h3 className="text-lg font-semibold text-gray-800">{i.title}</h3>
            )}
            <p className="text-gray-600 text-base leading-relaxed wrap-break-word">
              {i.content}
            </p>
          </div>
        ))
      ) : (
        <>
          {!question?.length && (
            <div className="w-full py-12 flex flex-col items-center gap-2 text-center">
              <p className="text-gray-400 font-medium">No questions yet</p>
              <p className="text-gray-300 text-sm">
                {isAdmin
                  ? 'Add FAQs using the "Add New" button in the sidebar.'
                  : "Check back later for answers to common questions."}
              </p>
            </div>
          )}
          <div className="w-full flex flex-col divide-y divide-gray-200 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {question?.map((q, idx) => (
              <QuestionCard
                key={idx}
                isAdmin={isAdmin}
                isEdit={true}
                idx={idx}
                data={q}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
