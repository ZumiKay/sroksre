"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function extractNames(fullName: string) {
  const nameParts = fullName.split(",");

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" "); // Join the remaining parts to get the last name

  return {
    firstName,
    lastName,
  };
}
interface userdata {
  email?: string;
  firstname?: string;
  lastname?: string;
}
export default function UserDashboard() {
  const session = useSession();
  const [userdata, setdata] = useState<userdata>({});
  useEffect(() => {
    if (session.data?.user) {
      const name = extractNames(session.data?.user?.name as string);
      console.log(name);
      setdata({
        ...userdata,
        firstname: name.firstName,
        lastname: name.lastName,
      });
    }
  }, [session]);

  return (
    <main className="user_dashboard__container w-full">
      <h1 className="text-2xl">Hello {userdata.firstname}</h1>
    </main>
  );
}
