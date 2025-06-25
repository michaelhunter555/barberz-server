import multer from "multer";

const storage = multer.memoryStorage();

const fileUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isValid = ["image/png", "image/jpg", "image/jpeg", "image/heic"].includes(
      file.mimetype
    );
    if(!isValid) {
        console.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
        cb(new Error("Invalid file type. Only PNG, JPG, JPEG, HEIC are allowed"));
        return;
    }

   cb(null, true);
  },
});
export default fileUpload;