const getMailerTransporter = require('../config/mailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = getMailerTransporter();

    if (!transporter) {
      console.log(`[Email Service (Simulated)]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text || html}\n`);
      return { simulated: true, success: true };
    }

    const info = await transporter.sendMail({
      from: `"Smart Procurement Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Sent] ID: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Send Error] To: ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// 1. Booking confirmed notification
const sendBookingConfirmedEmail = async ({ to, farmerName, tokenNumber, centreName, slotDate, startTime, endTime }) => {
  const subject = `Booking Confirmed — Token: ${tokenNumber}`;
  const text = `Dear ${farmerName},\n\n` +
    `Your procurement appointment has been successfully booked.\n\n` +
    `Token Number: ${tokenNumber}\n` +
    `Centre: ${centreName}\n` +
    `Date: ${slotDate}\n` +
    `Time Window: ${startTime} - ${endTime}\n\n` +
    `Please present this token at the registration desk when you arrive at the centre.\n\n` +
    `Regards,\nSmart Procurement Management Platform`;

  return sendEmail({ to, subject, text });
};

// 2. Crop procured notification
const sendCropProcuredEmail = async ({ to, farmerName, cropType, quantityKg, qualityGrade, ratePerKg, totalAmount }) => {
  const subject = `Crop Procured — ₹${totalAmount.toLocaleString('en-IN')} Payable`;
  const text = `Dear ${farmerName},\n\n` +
    `Your crop batch has been successfully inspected and weighed at the procurement centre.\n\n` +
    `Crop: ${cropType}\n` +
    `Net Quantity: ${quantityKg} kg\n` +
    `Quality Grade: ${qualityGrade}\n` +
    `MSP Rate: ₹${ratePerKg} / kg\n` +
    `Total Amount Payable: ₹${totalAmount.toLocaleString('en-IN')}\n\n` +
    `A direct bank transfer will be initiated to your registered account shortly.\n\n` +
    `Regards,\nSmart Procurement Management Platform`;

  return sendEmail({ to, subject, text });
};

// 3. Payment completed notification
const sendPaymentCompletedEmail = async ({ to, farmerName, amount, bankReferenceNumber, paidAt }) => {
  const subject = `Payment Disbursed — ₹${amount.toLocaleString('en-IN')}`;
  const formattedDate = new Date(paidAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const text = `Dear ${farmerName},\n\n` +
    `Your procurement payment of ₹${amount.toLocaleString('en-IN')} has been completed.\n\n` +
    `Amount: ₹${amount.toLocaleString('en-IN')}\n` +
    `Bank Reference / UTR Number: ${bankReferenceNumber}\n` +
    `Disbursement Date: ${formattedDate}\n\n` +
    `The funds should reflect in your registered bank account. Thank you for your service.\n\n` +
    `Regards,\nSmart Procurement Management Platform`;

  return sendEmail({ to, subject, text });
};

// 4. Gate check-in notification
const sendGateCheckinEmail = async ({ to, farmerName, tokenNumber, centreName, queuePosition, checkinTime }) => {
  const subject = `Gate Check-In Confirmed — Token: ${tokenNumber} (Queue #${queuePosition})`;
  const formattedTime = checkinTime
    ? new Date(checkinTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const text = `Dear ${farmerName},\n\n` +
    `Your arrival at the procurement centre has been successfully recorded at the gate.\n\n` +
    `Token Number: ${tokenNumber}\n` +
    `Centre: ${centreName || 'Procurement Centre'}\n` +
    `Assigned Scale Queue Position: #${queuePosition}\n` +
    `Check-in Time: ${formattedTime}\n\n` +
    `Please proceed to the vehicle holding area or farmer waiting yard. Your token number will be called when the weighing scale is ready for your batch.\n\n` +
    `Regards,\nSmart Procurement Management Platform`;

  return sendEmail({ to, subject, text });
};

module.exports = {
  sendEmail,
  sendBookingConfirmedEmail,
  sendCropProcuredEmail,
  sendPaymentCompletedEmail,
  sendGateCheckinEmail,
};

