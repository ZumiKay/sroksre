import { Addpolicytype, Addquestiontype } from "./action";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { ApiRequest, useCheckSession } from "@/src/context/CustomHook";
import { Policy, Question } from "@prisma/client";
import {
  ContainerLoading,
  errorToast,
  successToast,
} from "../component/Loading";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { AddPolicyModal } from "../component/Modals/CreatePolicyModal";
import { Showtypemodal } from "./secondcomponent";
import { ConfirmModal } from "../component/Modals/Alert_Modal";
import { Typeofpolicy } from "@/src/context/GlobalType.type";
import { Button } from "@heroui/react";
import { QuestionCard, SidePolicyBar } from "./component";

type PageParamType = {
  p?: string;
};

const policies = [{ id: 0, title: "Frequency Ask Question" }];

export default function PrivacyandPolicy(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const { openmodal, setopenmodal } = useGlobalContext();
  const searchParams = use(props.searchParams as never);
  const [loading, setloading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const { user } = useCheckSession();
  const params = searchParams as PageParamType;
  const router = useRouter();

  const pageId = useMemo(
    () => (params?.p ? parseInt(params.p) : undefined),
    [params.p]
  );

  const [page, setpage] = useState<number | undefined>(pageId);
  const [allpolicy, setallpolicy] = useState<Array<Policy>>();

  const [policy, setpolicy] = useState<
    Policy | Array<Policy> | Array<Question> | null
  >(null);
  const [pageTitle, setPageTitle] = useState<string>(
    "Privacy Policy | SrokSre"
  );

  // Update the title state when dependencies change
  useEffect(() => {
    if (page === 0) {
      setPageTitle("Frequent Ask Question | SrokSre");
    } else if (page !== undefined && (policy as Policy)?.title) {
      setPageTitle(`${(policy as Policy).title} | SrokSre`);
    } else {
      setPageTitle("Privacy Policy | SrokSre");
    }
  }, [page, policy]);

  useEffect(() => {
    async function GetAllPolicy() {
      setloading(true);
      const makeReq = await ApiRequest({
        url: "/api/policy?type=all",
        method: "GET",
      });
      setloading(false);
      if (!makeReq.success) {
        errorToast("Error Connection");
        return;
      }
      setallpolicy(makeReq.data as Array<Policy>);
    }
    GetAllPolicy();
  }, []);

  useEffect(() => {
    async function FetchData() {
      setloading(true);
      const getReq = await ApiRequest({
        url: `/api/policy?type=${page === 0 ? "faq" : page ? "id" : "all"}${
          page ? `&id=${page}` : ""
        }`,
        method: "GET",
      });
      setloading(false);
      if (getReq.data) {
        setpolicy(getReq.data as never);
      }
    }
    FetchData();
  }, [page]);

  const ShowTitle = useCallback(() => {
    const title =
      pageId === 0
        ? "FAQs (Frequent Ask Question)"
        : policy
        ? "title" in policy
          ? (policy as Policy).title
          : undefined
        : undefined;

    return (
      <h3 className="font-bold text-5xl w-[95%] max-small_phone:w-[90%] break-words">
        {title}
      </h3>
    );
  }, [pageId, policy]);

  const handleNavigateSideBar = useCallback(
    (key: number) => {
      const params = new URLSearchParams(searchParams as never);
      let value: number | undefined = undefined;

      if (pageId === key) {
        params.delete("p");
      } else {
        params.set("p", key.toString());
        value = key;
      }
      setpage(value);
      router.push(`?${params}`);
    },
    [pageId, router, searchParams]
  );

  const deleteRequest = useCallback(
    async (id: number, type: Typeofpolicy) => {
      const makeReq = await ApiRequest({
        url: `/api/policy?ty=${type}id=${id}`,
        method: "DELETE",
      });
      if (!makeReq.success) {
        errorToast("Can't Delete Policy");
        return;
      }
      successToast("Policy Deleted");

      //Update Policy
      const param = new URLSearchParams(searchParams as never);
      param.delete("p");
      router.push(`${param}`);
    },
    [router, searchParams]
  );
  const handleClickBtn = useCallback(
    ({
      type,
      id,
      deltype,
    }: {
      type: "Edit" | "Delete" | "Showtype";
      id?: number;
      deltype?: Typeofpolicy;
    }) => {
      switch (type) {
        case "Delete":
          setopenmodal({
            confirmmodal: {
              open: true,
              onAsyncDelete:
                id && deltype ? () => deleteRequest(id, deltype) : undefined,
            },
          });
          break;
        case "Edit":
          setIsEdit(true);
          setopenmodal({ addpolicy: true });
          break;
        case "Showtype":
          setopenmodal({ policyshowtype: true });
          break;

        default:
          break;
      }
    },
    [deleteRequest, setopenmodal]
  );

  return (
    <>
      <title>{pageTitle}</title>

      {/* Modal components - grouped together for better organization */}
      {openmodal["addpolicy"] && (
        <AddPolicyModal
          plc={isEdit ? (policy as unknown as Addpolicytype) : undefined}
          edit={isEdit}
        />
      )}
      {openmodal.policyshowtype && page && (
        <Showtypemodal
          id={page}
          value={new Set((policy as Policy).showtype?.split(",") ?? [""])}
        />
      )}
      {openmodal.confirmmodal?.open && <ConfirmModal />}

      <div className="flex flex-row items-start w-full min-h-screen pt-3">
        {loading && <ContainerLoading />}

        <SidePolicyBar
          handleNavigate={handleNavigateSideBar}
          page={page}
          data={[...policies, ...(allpolicy ?? [])]}
        />

        <div className="w-[80%] pl-5 content max-large_tablet:pl-0 max-large_tablet:w-full">
          {!params?.p ? (
            <div className="mb-10">
              <h2 className="w-full text-5xl font-bold">
                Policies and More Information
              </h2>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start w-full h-fit gap-y-5 mb-10">
                <ShowTitle />

                {pageId !== 0 && user?.role === "ADMIN" && (
                  <div className="w-full overflow-x-auto">
                    <div className="flex flex-row items-center justify-start w-full h-[40px] min-w-[280px] gap-6">
                      <Button
                        className="font-bold text-white bg-paid hover:bg-paid/90 transition-colors"
                        onPress={() => handleClickBtn({ type: "Edit" })}
                      >
                        Edit
                      </Button>
                      <Button
                        className="font-bold text-white bg-incart hover:bg-incart/90 transition-colors"
                        onPress={() => handleClickBtn({ type: "Showtype" })}
                      >
                        Display
                      </Button>
                      <Button
                        className="font-bold text-white bg-red-400 hover:bg-red-500 transition-colors"
                        onPress={() => handleClickBtn({ type: "Delete" })}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {pageId !== 0 ? (
                <PolicyContent
                  paragrah={(policy as unknown as Addpolicytype) ?? []}
                  isAdmin={user?.role === "ADMIN"}
                />
              ) : (
                <PolicyContent
                  question={(policy as unknown as Array<Addquestiontype>) ?? []}
                  isAdmin={user?.role === "ADMIN"}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
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
        paragrah.Paragraph?.map((i, idx) => (
          <div key={idx} className="w-full h-fit flex flex-col gap-5">
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
          {!question || !Array.isArray(question) || question.length === 0 ? (
            <h3 className="font-bold text-lg text-red-500">No question</h3>
          ) : (
            question.map((q, idx) => (
              <QuestionCard
                key={idx}
                isAdmin={isAdmin}
                isEdit={true}
                idx={idx}
                data={q}
              />
            ))
          )}
        </>
      )}
    </div>
  );
};
