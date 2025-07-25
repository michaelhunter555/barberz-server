import { Request, Response } from 'express';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import Booking from '../../../models/Booking';

export default async function(req: Request, res: Response) {
    const { bookingId } = req.body;

    if(!bookingId) {
        return void res.status(400).json({ error: 'Please pass a valid string value.', ok: false })
    }

    if(!req?.file) {
        return void res.status(400).json({ error: 'You must pass an image file for this controller', ok: false})
    }

    try {
        const booking = await Booking.findById(bookingId);

        if(!booking) {
            return void res.status(404).json({ error: 'No booking found for the given id', ok: false });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        booking.proofOfCompletionImg = result.secure_url;
        booking.serviceFee = booking.service || 0;
        await booking.save();

        res.status(200).json({ message: 'Image Successfully added!', ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error adding proof image ' + err, ok: false })
    }
}