import { Request, Response } from 'express';
import { findUserById } from '../../../lib/database/findUserById';

export default async function(req: Request, res: Response) {
    const { bookingPolicy } = req.body;
    const { barberId } = req.query;

    console.log("bookingPolicy: ", bookingPolicy)

    if(!barberId) {
        return void res.status(500).json({ error: 'The barberId is invalid or undefined', ok: false })
    }

    try  {
        const barber = await findUserById(String(barberId), res);
        if(!barber){
            return void res.status(404).json({ error: 'Could not find a user with the given id.', ok: false })
        }
        barber.cancelFee = bookingPolicy.cancelFee;
        barber.cancelFeeType = bookingPolicy.cancelFeeType;
        barber.cancelPolicy = bookingPolicy.cancelPolicy;
        barber.paymentPolicy = bookingPolicy.paymentPolicy;

        await barber.save();

       const { cancelFee, cancelFeeType, cancelPolicy, paymentPolicy} = barber;
       const updatedPolicy = { cancelFee, cancelFeeType, cancelPolicy, paymentPolicy};

        res.status(200).json({ updatedPolicy, ok: true })
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: 'Error updating booking policy', ok: false })
    }
}