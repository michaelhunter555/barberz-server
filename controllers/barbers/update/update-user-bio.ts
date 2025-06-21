import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { barberId, bio } = req.body;

    try {
        const user = await findUserById(String(barberId), res);
        if(!user) {
            return void res.status(404).json({ error: 'Unable to find the given user by id', ok: false });
        }
        user.bio = bio;
        await user.save();
        res.status(200).json({ message: 'bio successfully updated', ok: true })
    } catch(err) {
        console.log("Error updating user bio", err);
        res.status(500).json({ error: 'Error udpating user bio ' + err, ok: false })
    }
}