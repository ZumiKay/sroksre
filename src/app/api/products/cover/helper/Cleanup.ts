"use server";

import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { del } from "@vercel/blob";

/**Clean up image temp */

export const DeleteImageTempForCurrentUser = async (delStorage?: boolean) => {
  const user = await getUser();
  if (!user) return null;

  try {
    const deletedRecords = await Prisma.$transaction(async (tx) => {
      const records = await tx.tempimage.findMany({
        where: { user_id: user.id },
        select: { id: true, name: true },
      });

      if (records.length === 0) return [];

      await tx.tempimage.deleteMany({
        where: { user_id: user.id },
      });

      return records;
    });

    if (deletedRecords.length === 0) return null;

    let storageCleanup = true;
    if (delStorage) {
      const storageResults = await Promise.allSettled(
        deletedRecords.map((record) => del(record.name))
      );

      storageCleanup = storageResults.every(
        (result) => result.status === "fulfilled"
      );

      storageResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete ${deletedRecords[index].name} from storage:`,
            result.reason
          );
        }
      });
    }

    return {
      success: true,
      deletedCount: deletedRecords.length,
      dbCleanup: true,
      storageCleanup,
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
