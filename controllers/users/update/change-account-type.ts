import { Request, Response } from 'express';
import User from '../../../models/Barber';
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';

export default async function(req: Request, res: Response){
const { accountType, id } = req.query;

try {
const user = await User.findById(id);

if(!user) {
    return res.status(404).json({ error: "No user found with the given id", ok: false });
}

user.accountType = accountType === "user" ? "barber" : "user";
await user.save();

const userData = getAccountDetails(user);
res.status(200).json({ userData, ok: true,});
} catch(err) {
res.status(500).json({ error: 'There was an error trying to update the account type ' + err, ok: false});
}
}