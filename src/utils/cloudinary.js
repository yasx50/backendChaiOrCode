import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLODINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLODINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (loacalFilePath) => {
  try {
    if (!loacalFilePath) return null;
    const response = await cloudinary.uploader.upload(loacalFilePath, {
      resource_type: "auto",
    });
    // file has been upload successfully
    console.log("file is upoaded on clodinary !!", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(loacalFilePath); // ye file ko remove karega
    return null;
  }
};

export { uploadOnCloudinary };
