import {
  resetPromotionExpiryCheck,
  revertExpiredPromotions,
} from "@/src/lib/promotion";

export async function PUT() {
  try {
    const reverted = await revertExpiredPromotions();
    resetPromotionExpiryCheck();

    return Response.json(
      {
        message:
          reverted > 0
            ? "Updated Expired Promotions"
            : "No Expired Promotions Found",
        reverted,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error checking expired promotions:", error);
    return Response.json(
      {
        message: "An error occurred while updating promotions",
      },
      { status: 500 },
    );
  }
}
