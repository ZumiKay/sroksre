import { useState, useCallback } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import { errorToast } from "@/src/app/component/Loading";
import { VariantTemplateType } from "../Action";

export const useTemplateManager = () => {
  const [templates, setTemplates] = useState<VariantTemplateType[]>([]);
  const [reloadTemp, setReloadTemp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditTemp, setIsEditTemp] = useState(false);
  const [editTemplate, setEditTemplate] = useState<
    VariantTemplateType | undefined
  >(undefined);

  const fetchTemplates = useCallback(async () => {
    if (!reloadTemp) return;

    const asyncFetch = async () => {
      const res = await ApiRequest(
        "/api/products/variant/template?ty=short",
        undefined,
        "GET"
      );
      setReloadTemp(false);
      if (res.success) {
        setTemplates(res.data);
      }
    };

    await Delayloading(asyncFetch, setLoading, 1000);
  }, [reloadTemp]);

  const deleteTemplate = useCallback(async (id: number) => {
    setLoading(true);
    const request = await ApiRequest(
      "/api/products/variant/template",
      undefined,
      "DELETE",
      "JSON",
      { id }
    );
    setLoading(false);

    if (!request.success) {
      errorToast("Error Occurred");
      return false;
    }

    setReloadTemp(true);
    return true;
  }, []);

  return {
    templates,
    reloadTemp,
    setReloadTemp,
    loading,
    setLoading,
    isEditTemp,
    setIsEditTemp,
    editTemplate,
    setEditTemplate,
    fetchTemplates,
    deleteTemplate,
  };
};
