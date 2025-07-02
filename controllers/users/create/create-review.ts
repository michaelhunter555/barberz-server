import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../../../models/Review';
import { findUserById } from '../../../lib/database/findUserById';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import Booking from '../../../models/Booking';
import { io } from '../../../app';
import { Notifications } from '../../../types';

export default async function(req: Request, res: Response) {
    const {
        anonymize,
        bookingId, 
        userId, 
        barberId, 
        userReview, 
        price, 
        rating, 
        punctualityRating, 
        cleanlinessRating, 
        overallRating 
    } = req.body;

    console.log(req.body.files)

    const files = req.files as Record<string, Express.Multer.File[]>
    const imageArr = ["imageOne", "imageTwo", "imageThree"];
    const updatedImages = {};

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const [booking, user, barber] = await Promise.all([
             Booking.findById(String(bookingId)),
             findUserById(String(userId), res),
             findUserById(String(barberId), res),
        ])

        if(!user || !barber || !booking) {
            return void res.status(404).json({ error: 'Error finding user by id', ok: false });
        }

        for (const key of imageArr) {
            const file = files[key]?.[0];
            if (file) {
                const result = await uploadToCloudinary(file.buffer);
                updatedImages[key] = result.secure_url;
            } 
       }

       console.log("image urls:", updatedImages)

        const isAnonymized = anonymize === 'true';
        const nameParts = user.name.split(" ");
        const firstInitial = nameParts[0]?.[0] || 'U';
        const secondInitial = nameParts[1]?.[0] || 'X';
        const shortId = user?._id?.toString()?.substring(3, 10) || '0000000';
        const anonyName = `${firstInitial}${secondInitial}${shortId}`;
        
        const review = new Review({
            bookingId,
            userId,
            barberId,
           ...(isAnonymized 
            ? { userName: anonyName } 
            : { userImg: user.image, userName: user.name }),
            transactionCost: booking.price,
            userReview: userReview ?? "",
            rating: (Number(punctualityRating) +  Number(cleanlinessRating) +  Number(overallRating)) / 3,
            punctualityRating: Number(punctualityRating),
            cleanlinessRating: Number(cleanlinessRating),
            overallRating: Number(overallRating),
            barberFeedback: "",
            serviceDate: booking.bookingDateAndTime,
            ...updatedImages,
        })
        await review.save({ session });

        booking.reviewId = review._id;
        booking.hasReview = true;
        await booking.save({ session });

        barber.reviews?.push(review._id);
        barber.avgReviewScore = (barber.avgReviewScore + review.rating) / Number(barber?.reviews?.length || 0);
        barber.totalReviews = (barber?.totalReviews || 0) + 1;
        await barber.save({ session });


        user.reviews?.push(review._id);
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        io.to(String(user?._id)).emit(Notifications.USER_REVIEW_SUBMITTED, {
            message: `${user.name} has left you a review`,
            reviewId: review._id,
            rating: review.rating,
        })

        res.status(200).json({ message: 'Review Succesfully created!', ok: true })

    } catch(err) {
        console.log("error: ", err);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: err, ok: false });
    }
}