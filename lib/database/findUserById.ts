import { Response } from 'express';
import User from '../../models/User';

export const findUserById = async (id: number | string, res: Response) => {
    try {
        const user = await User.findById(id);
        if(!user) {
            return res.status(404).json({ error: 'Sorry, no user was found with that id' });
        }
        return user;
    } catch(err) {
        console.log("There was an error finding a user by id" + err);
        return res.status(500).json({ error: "finding user error " + err });
    }
}