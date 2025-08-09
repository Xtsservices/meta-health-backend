const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Mail transport config
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.adminEmail,
    pass: process.env.password,
  },
});

// Send Delete Account Email
const deleteUserAccount = async ({ userEmail, phone, app }) => {
  try {
    const htmlFilePath = path.join(
      __dirname,
      "./mailTemplates/deleteAccountMailTemplate.html"
    );

    let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");
    const companyEmail = process.env.companyEmail

    const modifiedHtmlContent = htmlContent
      .replace("[EMAIL]", userEmail)
      .replace("[PHONE]", phone)
      .replace("[APP]", app);

    await transporter.sendMail({
      from: process.env.adminEmail,
      to: companyEmail,
      subject: "Delete Account Request Received",
      html: modifiedHtmlContent,
    });

    console.log("Delete request email sent to:", userEmail);
  } catch (error) {
    console.error("Error sending delete account email:", error);
  }
};

module.exports = {
  deleteUserAccount,
};

