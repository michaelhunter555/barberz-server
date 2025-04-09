import { Request, Response } from 'express';
import User from '../../models/User';

const createUser = async (req: Request, res: Response) => {
    const { user } = req.body;
};

export default createUser;