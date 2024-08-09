// "use client";

// import { io } from "socket.io-client";
// import { NotificationType } from "./context/GlobalContext";
// import { SaveNotification } from "./app/severactions/notification_action";

// export const socket = io();

// export const SendNotification = async (data: NotificationType) => {
//   try {
//     const createnotify = await SaveNotification(data);

//     if (!createnotify.success) {
//       return { success: false };
//     }

//     socket.emit("sendnotify", data);
//   } catch (error) {
//     console.log("Error send notification", error);
//     return { success: false };
//   }
// };
