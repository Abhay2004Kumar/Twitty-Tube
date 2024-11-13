import { v2 as cloudinary} from "cloudinary";

import fs from "fs"

 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
       const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("filr iis uploaded ",  response.url);
        fs.unlinkSync(localFilePath)
      
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temmporary file as the failed upload operation
        return null
    }
}

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log('Delete result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw error;
    }
  };



export {uploadCloudinary, deleteFromCloudinary}