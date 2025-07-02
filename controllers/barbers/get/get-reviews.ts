import { Request, Response } from 'express';
import Review from '../../../models/Review';

export default async function( req: Request, res: Response) {
    const { barberId, page, limit, reviewDate, rating, order } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;

    const filters: any = {};
    //if(reviewDate) filters.reviewDate = reviewDate;
    //if(rating) filters.rating = rating;
    const sortOrder = order === '1' ? 1 : -1;

    try {
        const reviews = await Review.find(
            { barberId: String(barberId), ...filters }
        ).sort(
            { reviewDate: sortOrder }
        ).skip(
            (pageNum - 1) * limitNum
        ).limit(limitNum)

        if(!reviews) {
            return void res.status(404).json({ error: 'Could not find any reviews by id.', ok: false })
        }
        
        const totalReviews = await Review.countDocuments({  barberId: String(barberId), ...filters  });
        const totalPages = Math.ceil(totalReviews / limitNum);

        res.status(200).json({ 
            reviews: reviews ?? [], 
            page: pageNum, 
            limit: limitNum, 
            totalReviews, 
            totalPages, 
            ok: true 
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error getting reviews', ok: false })
    }
}