import { Request, Response } from 'express';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import Barber from '../../../models/Barber'
import { destroyImage } from '../../../lib/cloudinary/cloudinaryHelper';

export default async function(req: Request, res: Response) {
    const { barberId } = req.body;

    if(!req?.file || !barberId) {
        return void res.status(400).json({ error: 'You must pass an image file & userId for this controller', ok: false})
    }

    try {
        const barber = await Barber.findById(barberId);
        if(!barber) {
            return void res.status(404).json({ error: 'No user found with the given id.', ok: false })
        };

        if(barber.image.includes('cloudinary')) {
            const publicId = barber?.image.split("/").pop().split(".")[0];
            await destroyImage(publicId);
        };

        const result = await uploadToCloudinary(req.file.buffer);
        barber.image = result.secure_url;
        await barber.save();

        res.status(200).json({ image: barber?.image, ok: true });
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error updating barber image', ok: false });
    }
}