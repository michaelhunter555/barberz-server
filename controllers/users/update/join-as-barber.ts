import { Request, Response } from 'express';
import JoinApplications, { IJoinAgreements } from '../../../models/JoinApplications';
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response){
const { application, id } = req.body;
const { 
    firstName, 
    lastName,  
    city, 
    state, 
    zip,
    category,
    expiration,
    registrationNumber 
} = application;

console.log("Application: ",application);

try {
const user = await findUserById(String(id), res);

if(!user) {
    return void res.status(404).json({ error: "No user found with the given id.", ok: false });
}

if(user.accountType === 'barber') {
    return void res.status(400).json({ error: "You are already registered as a barber. If you are experiencing issues, please contact support.", ok: false })
}

const userLicense = {
    name: firstName + " " + lastName,
    city,
    state,
    zip,
    expiration,
    category,
    registrationNumber
};


const barberForm = {
    email: user.email,
    userId: user._id,
    name: firstName + " " + lastName,
    date: new Date(),
    location: city,
    isLicensed: application.isLicensed,
    termsApproved: application.termsApproved,
    isOnDemand: application.isOnDemand,
    didSign: application.didSign,
    signature: application.signature,
}
const serviceAgreement = new JoinApplications(barberForm);
await serviceAgreement.save();

user.userLicense = userLicense;
user.accountType = "barber" ;

// 
await user.save();

const userData = getAccountDetails(user);
res.status(200).json({ ...userData, ok: true,});
} catch(err) {
res.status(500).json({ error: 'There was an error trying to update the account type ' + err, ok: false});
}
}