import { fileTypeFromBuffer } from "file-type";

export async function isPng(buffer: Buffer): Promise<boolean> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);

    return fileType?.mime === "image/png";
  } catch {
    return false;
  }
}
