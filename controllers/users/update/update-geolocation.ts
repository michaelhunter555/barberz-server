import { Request, Response } from 'express';
import User from '../../../models/Barber';

export default async function (req: Request, res: Response) {
    const { lng, lat, email } = req.body;
    console.log("Email: ", email)
    try {
        let user = await User.findOne({ email});
        if(!user) {
           return void res.status(400).json({ error: 'Could not find any user with the following e-mail', ok: false});
        }
        const geoLocation = { type: 'Point', coordinates: [lng, lat] }
        user.geoLocation = geoLocation;
        await user.save();

        res.status(200).json({ message: "updated coords", ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error updating user geo-location: ' + err , ok: false})
    }
}