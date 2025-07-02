import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import { destroyImage} from '../../../lib/cloudinary/cloudinaryHelper';

export default async function (req: Request, res: Response) {
    const { barberId } = req.query;
    
    if (!barberId) {
        return void res.status(404).json({ error: 'barber id is undefined.', ok: false });
    }
    try {
        const barber = await findUserById(String(barberId), res);
        if (!barber) {
            return void res.status(404).json({ error: 'User not found', ok: false })
        }
        const imageArr = ["imageOne", "imageTwo", "imageThree", "imageFour", "imageFive", "imageSix"];
        const updatedImages = {};
        
        for (const key of imageArr) {
            const fileExists = req.files && req.files[key];
            const originalUrl = barber[key];

            if (fileExists) {
                const file = req.files?.[key][0];
                if (originalUrl?.includes('cloudinary')) {
                    const publicId = originalUrl.split("/").pop().split(".")[0];
                    await destroyImage(publicId);
                }
                const result = await uploadToCloudinary(file.buffer);
                barber[key] = result.secure_url;
                updatedImages[key] = result.secure_url;
            } else if (req.body?.[key] === "") {

                if (originalUrl?.includes('cloudinary')) {
                    const publicId = originalUrl.split("/").pop().split(".")[0];
                    await destroyImage(publicId);
                }
                barber[key] = "";
                updatedImages[key] = "";
            } else {
                updatedImages[key] = originalUrl;
            }
        }
        await barber.save();
        res.status(200).json({ ok: true, updatedImages })

    } catch (err) {
        console.log(`bulk update failed.`, err);
        res.status(500).json({ error: `bulk update failed`, err, ok: false })
    }
}