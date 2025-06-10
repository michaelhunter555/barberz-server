import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { id } = req.body;
    
    try {
    const user = await findUserById(String(id), res);
    if(!user) {
        return void res.status(404).json({ message: 'User not found.', ok: false })
    }
        user.isVisible = !user?.isVisible;
        await user.save();
        res.status(200).json({ isVisible: !user?.isVisible, ok: true })
    } catch(err) {
        res.status(200).json({ message: 'error updating visiblity ' + err, ok: false})
    }
}