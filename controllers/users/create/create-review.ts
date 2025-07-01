import { Request, Response } from 'express';
import Review from '../../../models/Review';
import { findUserById } from '../../../lib/database/findUserById';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';

export default async function(req: Request, res: Response) {
    const { bookingId, userReview } = req.body;
    const imageArr = ["imageOne", "imageTwo", "imageThree"];
    const updatedImages = {};

    try {
        const user = await findUserById(String(userReview.userId), res);
        const barber = await findUserById(String(userReview.barberId), res);

        if(!user) {
            return void res.status(404).json({ error: 'Error finding user by id', ok: false });
        }

        if(!barber) {
            return void res.status(404).json({ error: 'Error finding barber by id', ok: false });
        }

        for (const key of imageArr) {
            const fileExists = req.files && req.files[key];
            if (fileExists) {
                const file = req.files?.[key][0];
                const result = await uploadToCloudinary(file.buffer);
                updatedImages[key] = result.secure_url;
            } 
       }

        const review = new Review({
            bookingId,
            userId: userReview.userId,
            barberId: userReview.barberId,
            transactionCost: userReview.price,
            userReview: userReview.userReview ?? "",
            rating: userReview.rating,
            punctualityRating: userReview.punctualityRating,
            cleanlinessRating: userReview.cleanlinessRating,
            overallRating: userReview.overallRating,
            barberFeedback: "",
            ...updatedImages,
        })
        await review.save();

        barber.reviews?.push(review._id);
        user.reviews?.push(review._id);
        await barber.save();
        await user.save();

    } catch(err) {
        console.log("error: ", err);
        res.status(500).json({ error: err, ok: false });
    }
}