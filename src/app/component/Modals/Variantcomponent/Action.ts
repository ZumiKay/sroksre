"use server";

import { Varianttype } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";

export interface VariantTemplateType {
  id?: number;
  name: string;
  variant?: Varianttype;
}

export async function CreateVariantTemplate(data: VariantTemplateType) {
  try {
    if (data.name && data.variant) {
      await Prisma.varianttemplate.create({
        data: {
          variant: {
            create: {
              option_title: data.name,
              option_type: data.variant.option_type,
              option_value: data.variant.option_value as any,
            },
          },
        },
      });
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.log("Create Variant Template", error);
    return { success: false };
  }
}
