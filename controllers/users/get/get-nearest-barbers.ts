import { Request, Response } from 'express';
import Barber from '../../../models/Barber';
import type { PipelineStage } from 'mongoose';

export default async function (req: Request, res: Response): Promise<void> {
    try {
      const {
        longitude,
        latitude,
        radius,
        page = 1,
        limit = 25,
        startingPrice,
        search,
        rating,
      } = req.query;
  
      if (!longitude || !latitude || !radius) {
        res.status(400).json({ error: 'Missing geoLocation parameters', ok: false });
        return;
      }

      // console.log("queryData: ",req.query);
  
      const pageNum = Number(page) > 0 ? parseInt(String(page), 10) : 1;
      const limitNum = Number(limit) > 0 ? parseInt(String(limit), 10) : 25;
      const radiusInMeters = Number(radius) * 1609.34;
  
      // Start base query
      const geoQuery: Record<string, any> = {
        accountType: 'barber',
        isVisible: true,
      };
  
      // Only add if valid
      if (!isNaN(Number(startingPrice))) {
        geoQuery.startingPrice = { $lte: Number(startingPrice) };
      }
  
      if (!isNaN(Number(rating))) {
        geoQuery.avgReviewScore = { $gte: Number(rating) };
      }
  
      if (
        typeof search === 'string' &&
        search.trim().length > 2 &&
        search.trim().toLowerCase() !== 'undefined' &&
        search.trim().toLowerCase() !== 'null'
      ) {
        const regex = new RegExp(search.trim(), 'i');
        geoQuery.$or = [
          { location: regex },
          { primaryLocation: regex },
          { paymentPolicy: regex },
        ];
      }
  
      const pipeline: PipelineStage[] = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(longitude), Number(latitude)],
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            query: geoQuery,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'coupons',
            localField: 'coupons',
            foreignField: '_id',
            as: 'coupons',
          },
        },
        {
          $skip: (pageNum - 1) * limitNum,
        },
        {
          $limit: limitNum,
        },
      ];

     // console.log("pipeline: ", pipeline);
  
      const barbers = await Barber.aggregate(pipeline);
  
      // Count total matching barbers (same geoQuery)
      const totalCountResult = await Barber.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [Number(longitude), Number(latitude)],
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            query: geoQuery,
            spherical: true,
          },
        },
        { $count: 'total' },
      ]);
  
      const totalBarbers = totalCountResult[0]?.total ?? 0;
  
      if (!barbers.length) {
        res.status(404).json({ error: 'No barbers matched your filters.', ok: false });
        return;
      }
  
      res.status(200).json({
        barbers,
        currentPage: pageNum,
        totalPages: Math.ceil(totalBarbers / limitNum),
        totalBarbers,
        ok: true,
      });
    } catch (err) {
      console.error('[getBarbers] Error retrieving barbers:', err);
      res.status(500).json({ error: 'Internal server error', ok: false });
    }
  }
  

