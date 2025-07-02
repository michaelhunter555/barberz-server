import { Request, Response } from 'express';
import Review from '../../../models/Review';

export default async function( req: Request, res: Response) {
    const { reviewId } = req.query;
    console.log("reviewId: ", reviewId)
    try {
        const review = await Review.findById(String(reviewId))
        if(!review) {
            return void res.status(404).json({ error: 'Could not find any reviews by id.', ok: false })
        }
        res.status(200).json({ review, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting reviews', ok: false })
    }
}