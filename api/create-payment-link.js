import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { amount, rental_id } = req.body;

    try {
        const paymentLink = await razorpay.paymentLink.create({
            amount: amount * 100,
            currency: 'INR',
            description: 'Rental Payment',
            callback_url: `${process.env.FRONTEND_URL}/api/payment-callback`,
            callback_method: 'get'
        });

        const { error } = await supabase
            .from('payments')
            .insert({
                rental_id: rental_id,
                razorpay_order_id: paymentLink.id,
                amount: amount,
                status: 'created'
            });

        if (error) {
            console.error('Supabase insert error:', error);
            return res.status(500).json({ error: 'Failed to store payment record' });
        }

        res.status(200).json(paymentLink);
    } catch (error) {
        console.error('Payment link error:', error);
        res.status(500).json({ error: 'Failed to create payment link' });
    }
}
