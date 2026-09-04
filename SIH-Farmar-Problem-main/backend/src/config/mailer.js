const nodemailer = require('nodemailer');

const getMailerTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass && pass !== 'your_email_password' && pass !== 'your_email_app_password') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

module.exports = getMailerTransporter;
