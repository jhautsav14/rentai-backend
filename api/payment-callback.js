import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    const {
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_reference_id,
        razorpay_payment_link_status
    } = req.query;

    try {
        const isPaidStatus = ['paid', 'successful'].includes(
            (razorpay_payment_link_status || '').toLowerCase()
        );

        if (isPaidStatus) {
            const { error } = await supabase
                .from('payments')
                .update({
                    razorpay_payment_id,
                    status: 'paid',
                    payment_time: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('razorpay_order_id', razorpay_payment_link_id);

            if (error) {
                console.error('Supabase update error:', error);
            }

            return res.status(200).send(`
        <html>
          <body style="background:#0f172a; color:white; text-align:center; padding-top:50px;">
              <h1>🎉 Payment Successful!</h1>
              <p>Thank you for your payment.</p>
              <button style="background-color:cyan; color:black; padding:10px 20px; border-radius:8px;" onclick="window.close()">Go Back</button>
          </body>
        </html>
      `);
        } else {
            return res.status(200).send(`
        <html>
          <body style="background:#0f172a; color:white; text-align:center; padding-top:50px;">
              <h1>❌ Payment Failed or Cancelled</h1>
              <p>Status is not paid.</p>
              <button style="background-color:red; color:white; padding:10px 20px; border-radius:8px;" onclick="window.close()">Go Back</button>
          </body>
        </html>
      `);
        }
    } catch (error) {
        console.error('Payment callback error:', error);
        res.status(500).send('An error occurred.');
    }
}
