import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';
import Barber from '../../../models/Barber';
import { TUserQueryProps } from '../../../types';

const getBarbers = async (req: Request, res: Response) => {
    const { 
        longitude, 
        latitude, 
        radius, 
        page, 
        limit, 
        location, 
        price, 
        hours, 
    } = req.query;
    console.log(req.query);
    
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 25;
    const radiusInMeters = Number(radius) * 1609.34;

    const userQuery: TUserQueryProps = {};
    if(location) userQuery.location = String(location);
    if(price) userQuery.startingPrice = Number(price);
    if(hours) userQuery.hours = String(hours);


    try {
        const barbers = await Barber.find({
           accountType: 'barber',
            geoLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [Number(longitude), Number(latitude)]
                    },
                    $maxDistance: radiusInMeters,
                }
            }
        })
        .skip((pageNum - 1) * limitNum).limit(limitNum);

        if(!barbers) {
            return void res.status(404).json({ error: 'No barbers matched :(' });
        }

        const totalBarbers = await Barber.countDocuments(userQuery);

        console.log("Barbers: ", barbers)
        
        res.status(200).json({ 
            barbers, 
            currentPage: page, 
            totalPages: Math.ceil(totalBarbers/limitNum),
            totalBarbers,
            ok: true,
        })
    } catch(err) {
        console.log("Error retrieving barbers " + err)
        res.json({ error: "Error while retrieving barbers list " + err, ok: false})
    }
}

export default getBarbers;