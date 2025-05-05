import { Request, Response } from 'express';
import User from '../../../models/Barber';
import JoinApplications, { IJoinAgreements } from '../../../models/JoinApplications';
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';

export default async function(req: Request, res: Response){
const { application, email } = req.body;

try {
const user = await User.findOne({ email });

if(!user) {
    return void res.status(404).json({ error: "No user found with the given email", ok: false });
}

if(user.account === 'barber') {
    return void res.status(404).json({ error: "You are already registered as a barber. If you are experiencing issues, please contact support.", ok: false })
}
const barberForm = {
    email,
    userId: user._id,
    name: application.name,
    date: new Date(),
    location: application.location,
    isLicensed: application.isLicensed,
    termsApproved: application.termsApproved,
    isOnDemand: application.isOnDemand,
    didSign: application.didSign,
    signature: application.signature,
}
const serviceAgreement = new JoinApplications(barberForm);
await serviceAgreement.save();

user.accountType = "barber" ;
await user.save();

const userData = getAccountDetails(user);
res.status(200).json({ ...userData, ok: true,});
} catch(err) {
res.status(500).json({ error: 'There was an error trying to update the account type ' + err, ok: false});
}
}