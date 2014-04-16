var nodemailer = require('nodemailer');
var Person = require('../models/Person.js');

var smtpTransport = nodemailer.createTransport("SMTP", {
  service: 'Gmail',
  auth: {
    user: 'contact@nuisepic.com',
    pass: 'hardwork123'
  }
});

var mailOptions = {
  from: 'The EPIC Team <contact@nuisepic.com>',
  to: '',
  subject: "ACTION REQUIRED : Upload your resume for startups ",
  html: "<p>Hi,<br><p>On behalf of EPIC, thank you for registering for and attending Northwestern's first-ever Startup Career Fair. Startups unanimously praised the amount of talent and diversity of background in attendance at the fair. <br><p>In order for startups to get in touch with you, please take 20 seconds to upload your resume to the \"talent portal\" our team has created. Even if you already registered before the fair we ask that you re-upload your resume because startups will only have access to the talent portal.<br><p>You can upload your resume in 3 easy steps: <br><p>1) Follow this link: http://epic-talent-portal.herokuapp.com/register?id=reallylong# and set a password<br><p>2) Click the 'upload resume' button and upload your resume.<br><p>3) You should now be able to see your resume by clicking on its filename. Click 'save changes'.<br><br><p>If you have any questions, please email contact@nuisepic.com. <br><p>Thanks!<p>The EPIC Team"
};

module.exports = function(contacts) {
  contacts.forEach(function(contact) {
    console.log(contact);
    mailOptions.to = contact.email;
    mailOptions.html = mailOptions.html.split('reallylong#').join(contact._id.toString());
    smtpTransport.sendMail(mailOptions, function(error, resp) {
      if(error) console.log(error);
      else console.log("Message successfully sent to " + mailOptions.to);
    });
  });
}
