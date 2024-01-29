"use server";
interface returntype {
  success: boolean;
  message?: string;
  data?: any;
}

export async function Addtocart(data: FormData): Promise<returntype> {
  return { success: true };
}
