import { Role } from "@/prisma/generated/prisma/enums";

export interface Usersessiontype {
  sub: number;
  id: number;
  role: Role;
  session_id: string;
  name?: string;
  email?: string;
}

export type confirmmodaltype = {
  open: boolean;
  confirm: boolean;
  closecon: string;
  index?: number | string;
  Warn?: string;
  type?:
    | "product"
    | "banner"
    | "promotion"
    | "promotioncancel"
    | "user"
    | "userinfo";
  onDelete?: () => void;
  onAsyncDelete?: () => Promise<void>;
};

export interface userdata {
  id?: number;
  email?: string;
  password?: string;
  confirmpassword?: string;
  firstname?: string;
  lastname?: string;
  sessionid?: string;
  role?: Role;
  agreement?: boolean;
  cid?: string;
  recapcha: string | null;
}

export interface NotificationType {
  id?: number;
  type: string;
  content: string;
  link?: string;
  userid?: string;
  createdAt?: string;
  checked: boolean;
}

export interface UserState {
  id?: number;
  lastname?: string;
  password?: string;
  confirmpassword?: string;
  newpassword?: string;
  phonenumber?: string;
  role?: Role;
  firstname: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Userdatastate {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: Role;
  oldpassword?: string;
  newpassword?: string;
}
