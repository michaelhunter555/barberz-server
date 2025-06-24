import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import {v2 as cloudinary} from 'cloudinary';

export default async function(req: Request, res: Response) {
    const { barberId, imageIndex } = req.query;

    if(!req.file) {
        return void res.status(404).json({ error: 'No file type submitted.', ok: false });
    };

    if(!String(barberId)){
        return void res.status(404).json({ error: 'barber id is undefined.', ok: false });
    }

    const imageArr = ["imageOne", "imageTwo", "imageThree", "imageFour", "imageFive", "imageSix"]

    try {
    const barber = await findUserById(String(barberId), res);
    const imageNumber = imageArr[Number(imageIndex)];
    if(barber && imageIndex) {
        if(barber[imageNumber] !== "" && barber[imageNumber].includes("cloudinary")){
            const imageId = barber[imageNumber].split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imageId);
        }
        const result = await uploadToCloudinary(req.file.buffer);
        barber[imageNumber] = result.secure_url;
        await barber.save();
        res.status(200).json({ image: barber[imageNumber], ok: true})
    }
      } catch (err) {
       console.log(`error updating image ${Number(imageIndex) + 1}`, err);
       res.status(500).json({ error: `error updating image ${Number(imageIndex) + 1}`, err, ok: false })
      }
}