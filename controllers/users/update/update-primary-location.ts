import { Request, Response } from 'express';
import User from '../../../models/Barber';

export default async function (req: Request, res: Response) {
    const { userId, primaryLocation } = req.body;
    console.log("req.body: ", req.body);
    if(!userId || !primaryLocation) {
        return void res.status(400).json({ error: 'Please pass a valid userId and primaryLocation', ok: false })
    }
    try {
        let user = await User.findById(userId);
        if(!user) {
           return void res.status(400).json({ error: 'Could not find any user with the following e-mail', ok: false});
        }
       
        user.clientLocation.primaryLocation = primaryLocation;
        await user.save();

        res.status(200).json({ primaryLocation: user.clientLocation.primaryLocation, ok: true })
    } catch(err) {
        res.status(500).json({ error: 'Error updating user geo-location: ' + err , ok: false})
    }
}