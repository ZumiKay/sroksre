import { PixelCrop } from "react-image-crop";

export function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0
) {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set proper canvas dimensions to match crop size
  canvas.width = crop.width;
  canvas.height = crop.height;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save the current context state
  ctx.save();

  // Move the origin to center for rotation
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Move back to draw the image
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Calculate scaling between image natural size and displayed size
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Calculate actual source area accounting for scale and rotation
  const actualCropX = crop.x * scaleX;
  const actualCropY = crop.y * scaleY;
  const actualCropWidth = crop.width * scaleX;
  const actualCropHeight = crop.height * scaleY;

  // Draw the cropped image to the canvas
  ctx.drawImage(
    image,
    actualCropX,
    actualCropY,
    actualCropWidth,
    actualCropHeight,
    0,
    0,
    crop.width,
    crop.height
  );

  // Restore the context state
  ctx.restore();

  return new Promise<void>((resolve) => {
    resolve();
  });
}
