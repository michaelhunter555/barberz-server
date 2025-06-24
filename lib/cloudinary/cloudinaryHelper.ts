import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBuffer: Buffer) => {
    return await cloudinary.uploader.upload(`data:image/jpeg;base64,${fileBuffer.toString("base64")}`, {
      resource_type: "image",
    });
  };

export default uploadToCloudinary;