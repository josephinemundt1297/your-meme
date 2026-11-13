import multer from "multer";
import type { ApiHandler } from "../types/dependencies.js";
import { upload } from "./upload.js";

export const uploadImageFile: ApiHandler = (req, res, next) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        error: "Das Bild darf höchstens 5 MB groß sein.",
      });
    }

    if (error) {
      return res.status(400).json({
        error: "Bitte genau ein JPNG-Bild im Feld image senden.",
      });
    }

    next();
  });
};
