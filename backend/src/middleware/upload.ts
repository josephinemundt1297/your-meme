import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "image/png") {
      return callback(new Error("Nur PNG-Bilder sind erlaubt."));
    }

    callback(null, true);
  },
});
