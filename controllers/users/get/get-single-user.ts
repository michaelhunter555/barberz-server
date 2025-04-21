import { Request, Response } from 'express';
import User, { IBarber } from "../../../models/Barber";
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';

export default async function(req: Request, res: Response) {
    const { email, name, imagePath } = req.body;

    try {
        // check if user already exists
        let user = await User.findOne({ email });

        // if they don't exist create a new user for them
        if(!user) {
            const newUser =  { 
                userIsLive: true,
                accountType: 'user',
                email, 
                name, 
                image: imagePath 
            }
            user = new User(newUser);
            await user.save();
        }

        const userData = getAccountDetails(user);
        res.status(200).json({ _id: user._id, userData, ok: true });
    } catch(err) {
        console.log(err);
         res.status(500).json({ error: 'An error has occurred. ' + err, ok: false});
    }
}