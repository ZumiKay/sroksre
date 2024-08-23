import { getUser } from "@/src/context/OrderContext";
import { PolicyButton, QuestionCard, SidePolicyBar } from "./component";
import { Role } from "@prisma/client";
import {
  Addpolicytype,
  Addquestiontype,
  getAllPolicy,
  getPolicyById,
} from "./action";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LoadingIcon from "../component/Loading";

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
  } else {
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

    return <h3 className="font-bold text-5xl">{title}</h3>;
  };

  return (
    <div className="w-full min-h-screen">
      <SidePolicyBar
        isAdmin={user?.role === Role.ADMIN}
        data={[
          { id: 0, content: "FAQs" },
          ...allpolicy.map((i) => ({ id: i.id, content: i.title })),
        ]}
      />
      <div className="w-full content pl-[25%] pr-[10%] pt-5">
        {!params?.p ? (
          <>
            <h2 className="text-5xl font-bold w-full">
              Policies and More Informations
            </h2>
          </>
        ) : (
          <>
            <div className="w-full h-fit flex flex-row items-center justify-between mb-10">
              <ShowTitle />
              {pageId !== 0 && (
                <div className="w-fit h-[40px] flex flex-row gap-x-6 items-center">
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
              )}
            </div>

            <Suspense fallback={<LoadingIcon />}>
              {pageId !== 0 ? (
                <PolicyContent
                  paragrah={policy as Addpolicytype}
                  isAdmin={user?.role === Role.ADMIN}
                />
              ) : (
                <PolicyContent
                  question={policy as Addquestiontype[]}
                  isAdmin={user?.role === Role.ADMIN}
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
