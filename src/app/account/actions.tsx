export interface userdata {
  id?: number;
  email?: string;
  password?: string;
  confirmpassword?: string;
  firstname?: string;
  lastname?: string;
  sessionid?: string;
  role?: "ADMIN" | "USER" | "EDITOR";
  agreement?: boolean;
  cid?: string;
  phonenumber?: string;
}
