"use client";

import { SendNotification, useSocket } from "@/src/context/SocketContext";
import { Button, Input } from "@nextui-org/react";
import { useState } from "react";

export default function TestUi() {
  const [notification, setnotification] = useState("");
  const socket = useSocket();
  const handleSendNofication = async () => {
    if (!socket) return;
    const testdata = {
      type: "New Order",
      content: notification,
      checked: false,
    };
    socket?.emit("sendNotification", testdata);

    await SendNotification(testdata, socket);
  };
  return (
    <div className="h-screen w-screen flex flex-col items-center gap-y-20">
      <h3 className="text-5xl font-bold w-full h-fit text-center">
        Tesing Notification
      </h3>
      <Input
        type="text"
        size="lg"
        label="Notification"
        onChange={({ target }) => setnotification(target.value)}
      />
      <Button
        onClick={() => {
          handleSendNofication();
        }}
      >
        Send Notification
      </Button>
    </div>
  );
}
