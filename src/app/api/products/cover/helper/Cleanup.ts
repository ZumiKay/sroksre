"use server";

import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { del } from "@vercel/blob";

/**Clean up image temp */

export const DeleteImageTempForCurrentUser = async () => {
  const user = await getUser();

  if (!user) return null;

  const isTemp = await Prisma.tempimage.findMany({
    where: { user_id: user.id },
  });

  if (!isTemp || isTemp.length === 0) {
    return null;
  }

  try {
    // Run both cleanup operations in parallel
    const [deletedFromDB, deletedFromStorage] = await Promise.allSettled([
      // Delete from database
      Prisma.tempimage.deleteMany({
        where: { user_id: user.id },
      }),
      // Delete from Vercel Blob storage
      Promise.all(
        isTemp.map((temp) =>
          del(temp.name).catch((error) => {
            console.error(`Failed to delete ${temp.name} from storage:`, error);
            return null;
          })
        )
      ),
    ]);

    // Log results
    if (deletedFromDB.status === "rejected") {
      console.error("Failed to delete from database:", deletedFromDB.reason);
    }
    if (deletedFromStorage.status === "rejected") {
      console.error(
        "Failed to delete from storage:",
        deletedFromStorage.reason
      );
    }

    return {
      success: true,
      deletedCount: isTemp.length,
      dbCleanup: deletedFromDB.status === "fulfilled",
      storageCleanup: deletedFromStorage.status === "fulfilled",
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
