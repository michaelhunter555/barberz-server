import { Request, Response } from 'express';
import Barber from '../../models/Barber';
import { type TUserQueryProps } from '../../types';

const getUsers = async (req: Request, res: Response) => {
    const { page, limit, location, price, hours, } = req.query;
    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 25;

    const userQuery: TUserQueryProps = {location: ""};
    if(location) userQuery.location = String(location);
    if(price) userQuery.price = Number(price);
    if(hours) userQuery.hours = String(hours)

    try {
        const barbers = await Barber.find(userQuery)
        .populate({
            path:"User",
            select: "_id "
        }).skip((pageNum - 1) * limitNum).limit(limitNum);

        if(!barbers) {
            return res.status(404).json({ error: 'No barbers matched :(' });
        }

        const totalBarbers = await Barber.countDocuments(userQuery);
        
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

export default getUsers;