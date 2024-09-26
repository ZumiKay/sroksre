"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { NotificationType } from "./GlobalContext";
import { SaveNotification } from "../app/severactions/notification_action";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [sockset, setsocket] = useState<Socket | null>(null);

  useEffect(() => {
    // const socketIo = io(process.env.SOCKET_URL as string);
    // socketIo.on("connect", () => {
    //   console.log("Connected to socket server");
    // });
    // socketIo.on("connect_error", (err) => {
    //   console.error("Connection error:", err);
    // });
    // socketIo.on("disconnect", () => {
    //   console.log("Disconnected from socket server");
    // });
    // setsocket(socketIo);
    // return () => {
    //   socketIo.disconnect();
    // };
  }, []);

  return (
    <SocketContext.Provider value={sockset}>{children}</SocketContext.Provider>
  );
};

export async function SendNotification(data: NotificationType, socket: Socket) {
  socket.emit("sendNotification", data);

  const savenoti = SaveNotification.bind(null, data);
  const makereq = await savenoti();

  if (!makereq.success) {
    return { success: false };
  }

  return { success: true };
}
