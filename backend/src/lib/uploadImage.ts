import { cloudinary } from "./cloudinary.js";

type UploadedImage = {
  imageUrl: string;
  imageStorageId: string;
};

export function uploadImage(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        allowed_formats: ["png"],
        folder: "your-meme",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary hat kein Ergebnis geliefert."));
          return;
        }

        resolve({
          imageUrl: result.secure_url,
          imageStorageId: result.public_id,
        });
      },
    );

    stream.on("error", reject);
    stream.end(buffer);
  });
}
