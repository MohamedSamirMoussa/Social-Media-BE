import { v2 as cloudinary } from "cloudinary"


export const cloud = () => {
   cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME as string,
    api_key:process.env.CLOUDINARY_APi_KEY as string,
    api_secret:process.env.CLOUDINARY_APi_SECRET as string,
    secure:true,
   })

   return cloudinary
}