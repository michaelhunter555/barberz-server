import { Response } from 'express';
import User from '../../models/Barber';

export const findUserById = async (id: number | string, res: Response) => {
    try {
        const user = await User.findById(id);
        if(!user) {
            return void res.status(404).json({ error: 'Sorry, no user was found with that id' });
        }
        return user;
    } catch(err) {
        console.log("There was an error finding a user by id" + err);
        return void res.status(500).json({ error: "finding user error " + err });
    }
}