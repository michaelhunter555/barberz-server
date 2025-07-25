import { Request, Response } from 'express';
import JoinApplications, { IJoinAgreements } from '../../../models/JoinApplications';
import { getAccountDetails } from '../../../util/loginHelpers/loginHelpers';
import { findUserById } from '../../../lib/database/findUserById';
import uploadToCloudinary from '../../../lib/cloudinary/cloudinaryHelper';
import { encryptData } from '../../../util/encryption/encryptionHelpers';

export default async function(req: Request, res: Response){

const files = req.files as { [fieldName: string]: Express.Multer.File[]};
const { 
    id,
    firstName, 
    lastName,  
    city, 
    state, 
    zip,
    category,
    expiration,
    registrationNumber,
    isLicensed,
    termsApproved,
    isOnDemand,
    didSign = true,
    signature,
} = req.body;

console.log("Application: ", req.body);
console.log("FILES:", files);
console.log("BODY:", req.body);

try {
const user = await findUserById(String(id), res);

if(!user) {
    return void res.status(404).json({ error: "No user found with the given id.", ok: false });
}

// if(user.accountType === 'barber') {
//     return void res.status(400).json({ error: "You are already registered as a barber. If you are experiencing issues, please contact support.", ok: false })
// }

if(!files.imageIdFront?.[0] || !files.imageIdBack?.[0]){
    return void res.status(400).json({ error: "Please provide a valid image for upload.", ok: false });
}

const idFront = await uploadToCloudinary(files.imageIdFront[0].buffer);
const idBack = await uploadToCloudinary(files.imageIdBack[0].buffer);

if(!idFront.secure_url || !idBack.secure_url) {
    throw new Error('Unable to encrypt & store the user images.')
}

// user license for clientside
const userLicense = {
    name: firstName + " " + lastName,
    city,
    state,
    zip,
    expiration,
    category,
    registrationNumber
};

// barber form for db
const barberForm = {
    email: user.email,
    userId: user._id,
    name: firstName + " " + lastName,
    date: new Date(),
    location: city,
    isLicensed: isLicensed,
    termsApproved: termsApproved,
    isOnDemand: isOnDemand,
    didSign: didSign,
    signature: signature,
    imageIdFront: encryptData(idFront.secure_url),
    imageIdBack: encryptData(idBack.secure_url),
}

const serviceAgreement = new JoinApplications(barberForm);
await serviceAgreement.save();

// update user
user.userLicense = userLicense;
user.accountType = "barber" ;
await user.save();

const userData = getAccountDetails(user);
res.status(200).json({ user: userData, ok: true,});
} catch(err) {
    console.log(err);
res.status(500).json({ error: 'There was an error trying to update the account type ' + err, ok: false});
}
}