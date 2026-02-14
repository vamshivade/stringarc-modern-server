require('dotenv').config();
import Joi from "joi";
const fs = require("fs");
import jwt from "jsonwebtoken";
const { S3Client, S3ServiceException, PutObjectCommand } = require("@aws-sdk/client-s3");
import nodemailer from "nodemailer";
import cloudinary from "cloudinary";

import qrcode from "qrcode";
const supportEmail = process.env.supportEmail;

// AWS.config.update({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });
// const s3 = new AWS.S3({});

// const uploadToS3 = async (buffer, contentType, fileName) => {
//     const params = {
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: `uploads/ModrenImages/${fileName}_${Date.now()}`,
//         Body: buffer,
//         ContentType: contentType,
//         // ACL: 'public-read', // or private if you want secure access
//     };

//     const uploadResult = await s3.upload(params).promise();
//     console.log(uploadResult,"uploadResult",uploadResult.Location);
    
//     return uploadResult.Location; // this is the public URL
// };

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadToS3 = async (buffer, contentType, fileName) => {
    const key = `uploads/ModrenImages/${fileName}_${Date.now()}`;
    
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });
    try {
        const response = await s3Client.send(command);
    } catch (caught) {
        if (
            caught instanceof S3ServiceException &&
            caught.name === "EntityTooLarge"
        ) {
            console.error(`Error from S3 while uploading object.`);
        } else if (caught instanceof S3ServiceException) {
            console.error(
                `Error from S3 while uploading object to ${bucketName}.  ${caught.name}: ${caught.message}`,
            );
        } else {
            throw caught;
        }
    }
    const location = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(key)}`;
    return location;
};

module.exports = {

    getImageUrl: async (files) => {
        try {
            const file = files[0];
            const fileBuffer = fs.readFileSync(file.path);
            const contentType = file.mimetype;

            const url = await uploadToS3(fileBuffer, contentType, file.originalname);
            return url;
        } catch (error) {
            console.log(error);
        }
    },

    getSecureUrl: async (base64) => {
        try {
            const matches = base64.match(/^data:(.+);base64,(.+)$/);
            if (!matches) throw new Error("Invalid base64 string");

            const contentType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const extension = contentType.split('/')[1];
            const fileName = `base64.${extension}`;

            const url = await uploadToS3(buffer, contentType, fileName);
            return url;
        } catch (error) {
            console.log(error);
        }
    },
    getOTP() {
        var otp = Math.floor(100000 + Math.random() * 900000);
        return otp;
    },
    generateTempPassword() {
        return Math.random().toString(36).slice(2, 10);
    },

  getToken: async (payload) => {
    var token = await jwt.sign(payload, process.env.jwtsecret
    //     , {
    //   expiresIn: "24h",
    // }
);
    return token;
  },

   
    genBase64: async (data) => {
        return await qrcode.toDataURL(data);
    },

    

   


  sendMailForSubAdmin: async (to, name, password, admin) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        td {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2> Sub-Admin Account Created Successfully</h2>
        <p>Dear ${name},</p>
        
        <p> This is to inform you that a new sub-administrator account has been successfully created. Below are the details of the newly created sub-administrator account:</p>
        


<hr>
            <table style="width: 100%;">
                <tr>
                    <td style="text-align: left;">Sub-Admin Name:</td>
                    <td style="text-align: right;">${name}</td>
<br>
                </tr>
                <tr>
                    <td style="text-align: left;">Sub-Admin Email:</td>
                    <td style="text-align: right;">${to}</td>

                </tr>
               
                <tr>
                    <td>Password:</td>
                    <td style="text-align: right;">${password}</td>

                </tr>
                <tr>
                    <td> Portal URL:</td>
                    <td style="text-align: right; " ><a style = "color: #fff;"type="button" class="" href="https://stradmin.stringarc8.io"
                    target="_blank">Admin Panel</a></td>

                </tr>
                

            </table>

            <p>  The sub-administrator now has access to manage certain aspects of STRING ARC8 based on the assigned access level. Please ensure that they are briefed on their responsibilities and access rights accordingly.</p>
        
            <p> If you have any questions or concerns regarding this sub-administrator account creation, please feel free to contact us at [Administrator's Contact Email].</p>
            
            <p> Thank you for your attention to this matter.</p>
            <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
            <p>  Best regards,</p>
            <p>  The STRING ARC8 Team</p>
            <br>
        </div>
        <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        </div>
    </div>
</body>
    
    </html>
    `;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      // host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: "Sub-Admin Account Created Successfully",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailForBlock: async (to, name, reason) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>Your STRING ARC8  Account Suspended.</h2>
           <p> Dear ${name},</p>
            
           <p> We regret to inform you that your account on STRING ARC8 has been blocked by our administrative team due to "${reason}".</p>
            
           <p> Thank you for your understanding.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
           <p> Best regards,</p>
           <p> The STRING ARC8 Team</p>
            
            
            
           
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
           
        
        </div>
    </body>
    
    </html>
    `;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: "Account Blocked",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailForUnblock: async (to, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
           <h2>  Account Unblocked - STRING ARC8</h2>

            <p>Dear ${name}</p>
            
            <p> We're pleased to inform you that your account on STRING ARC8 has been unblocked by our administrative team.</p>
            
            <p> You can now access your account and resume enjoying all the features and benefits of STRING ARC8. We apologize for any inconvenience this may have caused and appreciate your patience during the review process.</p>
            
            <p> If you have any questions or require further assistance, please don't hesitate to contact our support team at STRING ARC8!</p>
            
            <p> Thank you for being a valued member of our community.</p>
            <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
            <p>  Best regards,</p>
            <p>  The STRING ARC8 Team </p>
            
            
            
           
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>
    `;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: "Account Unblocked",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailContactus: async (to, name, userNames, emails, msg) => {
    let html = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }

      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                          alt="ARC8" width="70px" height="70px">
                      <h2 style="margin-bottom: 30px;">String Arc8</h2>
                  </div>
              </header>
              <h2>User Query for - STRING ARC8 </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you that there is a msg from ${userNames}.</p>
 <p>The user's query is provided below.</p>
 <p>${msg}</p>
 
 <p>Thank you for your attention to this matter.</p>

 <p>Best regards from ${userNames},</p>
 <p>The STRING ARC8 Team</p>
             
             <br>
          </div>
          <div>
              <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                      href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                  of email, Don’t want any more emails from String Arc8?<a
                  href="mailto:${supportEmail}">Unsubscribe</a></p>
              <footer>
                        <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
              </footer>
          </div>
      </div>
  </body>
  
  </html>`;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: `User Query`,
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailContactusUser: async (to, name, msg) => {
    let html = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }

      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                          alt="ARC8" width="70px" height="70px">
                      <h2 style="margin-bottom: 30px;">String Arc8</h2>
                  </div>
              </header>
              <h2>User Query for - STRING ARC8 </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you send a query .</p>
 <p>Your query is : ${msg}</p>
 
 
 <p>Thank you for your attention to this matter.</p>

 <p>Best regards from STRING ARC8,</p>
 <p>The STRING ARC8 Team</p>
             
             <br>
          </div>
          <div>
              <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                      href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                  of email, Don’t want any more emails from String Arc8?<a
                  href="mailto:${supportEmail}">Unsubscribe</a></p>
              <footer>
                        <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
              </footer>
          </div>
      </div>
  </body>
  
  </html>`;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: `User Query`,
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailReplyFromAdmin: async (to, name, msg, question) => {
    let html = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
      body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
          color: #fbf2f2;
      }

      .main-container {
          max-width: 600px;

          margin: 0 auto;
          padding: 30px;
          background-color: #211124;
          border-radius: 5px;
          overflow: hidden;
          /* Added to handle potential overflow */
      }

      .container {
          max-width: 100%;
          /* Adjusted to full width on smaller screens */
          max-height: 1000px;
          margin-top: 10px;
          padding: 20px;
          background-color: #190c1b;
          border-radius: 5px;
      }

      header {
          text-align: center;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      img {
          max-width: 100%;
          /* Added to make the image responsive */
          height: auto;
          /* Added to maintain aspect ratio */
      }
      .contactbutton {
        border: 1px solid #b120c9 !important;
        background: #19051c !important;
        box-shadow: inset 0 0 10px 0 #580665 !important;
        color: #fff !important;
        padding: 13px 30px;
        border-radius: 10px;
        margin-bottom: 24px;
        margin-top: 10px;
        text-decoration: none;
        font-size: 14px;
    }
      h2 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #fbf2f2;
      }

      p {
          margin-bottom: 15px;
          line-height: 1.5;
          color: #fbf2f2;
      }

      .otp-code {
          display: flex;
          justify-content: center;
          margin: 10px auto;
          color: #fbf2f2;
      }

      .otp-code h3 {
          font-size: 24px;
          margin: 0 10px;
          text-align: center;
          color: #fbf2f2;
      }

      footer {
          border-top: 1px solid #5f5858;
          padding-top: 20px;
          text-align: center;
      }

      a {
          text-decoration: underline;
      }

      @media only screen and (max-width: 600px) {
          .container {
              padding: 15px;
          }

          header {
              text-align: center;
          }

          h2 {
              font-size: 20px;
              color: #fbf2f2;
          }

          .otp-code h3 {
              font-size: 20px;
              color: #fbf2f2;
          }
      }
  </style>
  </head>
  
  <body>
      <div class="main-container">
          <div class="container">
              <header>
                  <div style="display: flex; align-items: center; justify-content: center;">
                      <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                          alt="ARC8" width="70px" height="70px">
                      <h2 style="margin-bottom: 30px;">String Arc8</h2>
                  </div>
              </header>
              <h2> Query Reply from Admin- STRING ARC8 </h2>
              
              <p>Dear ${name}👋</p>
 <p>We're writing to inform you that there is a reply for you query .</p>
 <p>Reply for  : ${question}</p>
 <p> ${msg}</p>
 
 <p>Thank you for your attention to this matter.</p>
 <div style="margin: 40px 0 50px;">
 <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
     target="_blank">Contact Us</a>
</div>
 <p>Best regards from ARC8 Team,</p>
 <p>The STRING ARC8 Team</p>
             
             <br>
          </div>
          <div>
              <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                      href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                  of email, Don’t want any more emails from String Arc8?<a
                  href="mailto:${supportEmail}">Unsubscribe</a></p>
              <footer>
                        <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
              </footer>
          </div>
      </div>
  </body>
  
  </html>`;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: `Query Reply`,
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailOtp: async (email, otp, userName) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>OTP Verification for STRING ARC8</h2>
            <p>Dear ${userName}</p>
            <p>Thank you for signing up with STRING ARC8. To ensure the security of your account, we require you to
                verify your email address.</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing STRING ARC8. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The STRING ARC8 Team</p><br>
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Otp for verification",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailForWithdrawal: async (email, otp, userName) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>OTP for Withdrawal Verification</h2>
            <p>Dear ${userName}</p>
            <p>Thank you for signing up with STRING ARC8. To ensure the security of your withdrawal, we require you to
                verify .</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing STRING ARC8. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The STRING ARC8 Team</p><br>
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>
    `;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Otp for withdrawal Verification",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailForgotPassOtp: async (email, otp, userName) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
                <h2>Reset OTP for STRING ARC8!</h2>
                <p>Dear ${userName},</p>
                <p>We've received a request to reset the password for your STRING ARC8 account. To proceed with the password
                    reset process, please use the following One-Time Password (OTP):</p>
                <div class="otp-code">
                    <h3>${otp}</h3>
                </div>
                <p>You can enter this code on the password reset page of our website to securely reset your password. Please
                    note that this OTP is valid for a limited time period.</p>
                <p>If you did not initiate this password reset request, please disregard this email. Your account remains
                    secure, and no changes have been made.</p>
                <p>For security reasons, we recommend keeping your OTP confidential and not sharing it with anyone. If you
                    need further assistance or have any concerns, please don't hesitate to contact our support team at
                    [Support Email].</p>
                <p>Thank you for choosing STRING ARC8. We're here to ensure a smooth and secure experience for all our
                    players.</p><br>
                    <div style="margin: 40px 0 50px;">
                    <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                        target="_blank">Contact Us</a>
                </div>
                <p>Best regards,</p>
                <p>The STRING ARC8 Team</p><br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Otp for reset password",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmail2FAOtp: async (email, status, name) => {
    let html = `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
            body {
                font-family: sans-serif;
                margin: 0;
                padding: 0;
                color: #fbf2f2;
            }
    
            .main-container {
                max-width: 600px;
    
                margin: 0 auto;
                padding: 30px;
                background-color: #211124;
                border-radius: 5px;
                overflow: hidden;
                /* Added to handle potential overflow */
            }
    
            .container {
                max-width: 100%;
                /* Adjusted to full width on smaller screens */
                max-height: 1000px;
                margin-top: 10px;
                padding: 20px;
                background-color: #190c1b;
                border-radius: 5px;
            }
    
            header {
                text-align: center;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
            .contactbutton {
                border: 1px solid #b120c9 !important;
                background: #19051c !important;
                box-shadow: inset 0 0 10px 0 #580665 !important;
                color: #fff !important;
                padding: 13px 30px;
                border-radius: 10px;
                margin-bottom: 24px;
                margin-top: 10px;
                text-decoration: none;
                font-size: 14px;
            }
            img {
                max-width: 100%;
                /* Added to make the image responsive */
                height: auto;
                /* Added to maintain aspect ratio */
            }
    
            h2 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
    
            td {
                font-size: 15px;
                margin-bottom: 20px;
                color: #fbf2f2;
            }
    
            p {
                margin-bottom: 15px;
                line-height: 1.5;
                color: #fbf2f2;
            }
    
            .otp-code {
                display: flex;
                justify-content: center;
                margin: 10px auto;
                color: #fbf2f2;
            }
    
            .otp-code h3 {
                font-size: 24px;
                margin: 0 10px;
                text-align: center;
                color: #fbf2f2;
            }
    
            footer {
                border-top: 1px solid #5f5858;
                padding-top: 20px;
                text-align: center;
            }
    
            a {
                text-decoration: underline;
            }
    
            @media only screen and (max-width: 600px) {
                .container {
                    padding: 15px;
                }
    
                header {
                    text-align: center;
                }
    
                h2 {
                    font-size: 20px;
                    color: #fbf2f2;
                }
    
                .otp-code h3 {
                    font-size: 20px;
                    color: #fbf2f2;
                }
            }
        </style>
        </head>
        
        <body>
            <div class="main-container">
                <div class="container">
                    <header>
                        <div style="display: flex; align-items: center; justify-content: center;">
                            <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                                alt="ARC8" width="70px" height="70px">
                            <h2 style="margin-bottom: 30px;">String Arc8</h2>
                        </div>
                    </header>
                    <h2>Email Verification Status Update - STRING ARC8 </h2>
                    
                    <p>Dear ${name}👋</p>
       <p>We're writing to inform you that the email verification status for your account on STRING ARC8  has been updated.</p>
                        <table style="width: 100%;">
                    <tr>
                        <td style="text-align: left;">Email Verification:</td>
                        <td style="text-align: right;">${status}</td>
    
                    </tr>
                   
                    
    
                </table>
       
       <p>If you have any questions or concerns regarding your email verification status, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
    
       <p>Thank you for your attention to this matter.</p>
       <div style="margin: 40px 0 50px;">
       <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
           target="_blank">Contact Us</a>
    </div>
       <p>Best regards,</p>
       <p>The STRING ARC8 Team</p>
                   
                   <br>
                </div>
                <div>
                    <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                            href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                        of email, Don’t want any more emails from String Arc8?<a
                        href="mailto:${supportEmail}">Unsubscribe</a></p>
                    <footer>
                              <footer>
                    <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
                <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
                <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
                <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
            </div>
                      <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
         </p> 
                    </footer>
     </p> 
                    </footer>
                </div>
            </div>
        </body>
        
        </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Email Verification Status",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  sendEmailForWelcome: async (email, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
               <h2> Welcome to STRING ARC8!</h2>
<p>Dear ${name},</p>

<p>Welcome to STRING ARC8! We're thrilled to have you join our gaming community. Get ready for an exciting adventure filled with thrilling games, engaging challenges, and endless fun!</p>

<p>Here's a quick overview of what you can expect from your STRING ARC8 experience:</p>

<p>Explore a Variety of Games: Dive into a diverse collection of games ranging from action-packed adventures to brain-teasing puzzles. With new releases and updates regularly added, there's always something fresh to enjoy.</p>

<p>Connect with Players: Engage with fellow gamers from around the world. Whether you're looking for allies to conquer quests or rivals to challenge, our vibrant community is always ready to connect.</p>

<p>Unlock Achievements and Rewards: Set goals, complete challenges, and earn rewards! As you progress through games, unlock achievements, and level up your skills, you'll discover exciting rewards waiting for you.</p>

<p>Stay Updated: Don't miss out on the latest news, events, and special offers. Keep an eye on your inbox for updates, promotions, and exclusive content tailored just for you.</p>

<p>To kick-start your gaming journey, we've included a special bonus just for new players.</p>

<p>Ready to start playing? Simply log in to your account and explore the world of STRING ARC8 today!</p>

<p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at support@STRING ARC8.com anytime.</p>

<p>Once again, welcome aboard, ${name}! Get ready to unleash your gaming potential and embark on epic adventures with STRING ARC8</p>
<div style="margin: 40px 0 50px;">
<a type="button" class="contactbutton" href="https://stringarc8.io/contact"
    target="_blank">Contact Us</a>
</div>
<p>Best regards,</p>
<p>The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Welcome to STRING ARC8!",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailForPasswordResetSuccess: async (email, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
               <h2> Password Reset Successfully - STRING ARC8!</h2>
             <p>   Dear ${name},</p>
                
             <p> We're writing to inform you that the password for your STRING ARC8 account has been successfully reset. You can now log in using your new password and resume enjoying our games and features.</p>
                
             <p>  If you initiated this password reset request, you can disregard this email.</p>
                
             <p>  If you did not initiate this password reset request, please contact our support team immediately at [Support Email] for further assistance.</p>
                
             <p> Thank you for choosing STRING ARC8 If you have any questions or encounter any issues, please don't hesitate to reach out to us.</p>
             <div style="margin: 40px 0 50px;">
             <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                 target="_blank">Contact Us</a>
         </div>
             <p>  Best regards,</p>
             <p> The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Password Reset Successfully",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  sendEmailForPasswordChangeSuccess: async (email, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
               <h2> Password Change Successfully - STRING ARC8!</h2>
             <p>   Dear ${name},</p>
                
             <p> We're writing to inform you that the password for your STRING ARC8 account has been successfully changed. You can now log in using your new password and resume enjoying our games and features.</p>
                
             <p>  If you initiated this password change request, you can disregard this email.</p>
                
             <p>  If you did not initiate this password reset request, please contact our support team immediately at [Support Email] for further assistance.</p>
                
             <p> Thank you for choosing STRING ARC8 If you have any questions or encounter any issues, please don't hesitate to reach out to us.</p>
             <div style="margin: 40px 0 50px;">
             <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                 target="_blank">Contact Us</a>
         </div>
             <p>  Best regards,</p>
             <p> The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Password Change Successfully",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  sendEmailForEnableGoogle2FA: async (email, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
               <h2> Google Authentication Verification</h2> 
               <h2>  Activated- STRING ARC8 </h2>
                <p>Dear ${name}👋</p>
                <p>To enhance the security of your account on STRING ARC, we have enabled Google Authentication. This additional layer of security helps protect your account from unauthorized access.</p>
                
                <p> To complete the setup process, please follow the instructions below:</p>
                
                <p> Download Google Authenticator: If you haven't already, download the Google Authenticator app from the App Store (iOS) or Google Play Store (Android).</p>
                
                <p> Scan QR Code: Open the Google Authenticator app and scan the QR code </p>
                
                <p> Enter Verification Code: After scanning the QR code, enter the verification code provided by the app into the designated field on STRING ARC8.</p>
                
                <p> If you have any questions or encounter any issues during the setup process, please contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                
                <p> Thank you for choosing [Game Website]. We appreciate your cooperation in enhancing the security of your account.</p>
                <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
                <p> Best regards,</p>
                <p> The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Google Authentication Verification",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailForBuyTicket: async (email, name, amount, walletAddress, time) => {
    let html = `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #fbf2f2;
                }
        
                .main-container {
                    max-width: 600px;
        
                    margin: 0 auto;
                    padding: 30px;
                    background-color: #211124;
                    border-radius: 5px;
                    overflow: hidden;
        
                }
        
                .container {
                    max-width: 100%;
        
                    margin-top: 10px;
                    padding: 20px;
                    background-color: #190c1b;
                    border-radius: 5px;
                }
        
                header {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #fbf2f2;
                }
        
                img {
                    max-width: 100%;
        
                }
        
                tr {
                    padding-bottom: 10px;
                   
                }
                .contactbutton {
                    border: 1px solid #b120c9 !important;
                    background: #19051c !important;
                    box-shadow: inset 0 0 10px 0 #580665 !important;
                    color: #fff !important;
                    padding: 13px 30px;
                    border-radius: 10px;
                    margin-bottom: 24px;
                    margin-top: 10px;
                    text-decoration: none;
                    font-size: 14px;
                }
                h2 {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #fbf2f2;
                }
        
                td {
                    font-size: 14px;
                }
        
                tr {
                    font-size: 14px;
                }
        
                th {
                    font-size: 14px;
                }
        
                p {
                    margin-bottom: 15px;
                    line-height: 1.5;
                    color: #fbf2f2;
                }
                td {
                    margin-bottom: 15px;
                    line-height: 1.5;
                    color: #fbf2f2;
                }
                .otp-code {
                    display: flex;
                    justify-content: center;
                    margin: 10px auto;
                    color: #fbf2f2;
                }
        
                .otp-code h3 {
                    font-size: 24px;
                    margin: 0 10px;
                    text-align: center;
                    color: #fbf2f2;
                }
        
                footer {
                    border-top: 1px solid #5f5858;
                    padding-top: 20px;
                    text-align: center;
                }
        
                a {
                    text-decoration: underline;
                }
        
                @media only screen and (max-width: 600px) {
                    .container {
                        padding: 15px;
                    }
        
                    header {
                        text-align: center;
                    }
        
                    h2 {
                        font-size: 20px;
                        color: #fbf2f2;
                    }
        
                    .otp-code h3 {
                        font-size: 20px;
                        color: #fbf2f2;
                    }
                }
            </style>
        </head>
        
        <body>
            <div class="main-container">
                <div class="container">
                    <header>
                        <div style="display: flex; align-items: center; justify-content: center;">
                            <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                                alt="ARC8" width="70px" height="70px">
                            <h2 style="margin-bottom: 30px;">String Arc8</h2>
                        </div>
                    </header>
                    <h2>Ticket Purchase Confirmation - </h2>
                    <h2>STRING ARC8</h2>
                    <p>Dear ${name}👋</p>
                    <p>We're writing to confirm that your ticket purchase on ARC8 has been successfully processed</p>
                       <p> using your wallet funds. Below are the details of your purchase:</p>
                    
        
        
        <hr>
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: left;">Date and Time of Purchase</td>
                               <td style="text-align: right;">${time}</td>
              
                              </tr>
                              <tr>
                                  <td style="text-align: left;">Wallet Deduction</td>
                                  <td style="text-align: right;">${amount}</td>
              
                              </tr>
                             
                              <tr>
                                  <td>Wallet Address</td>
                                  <td style="text-align: right;">${walletAddress}</td>
              
                              </tr>
                        
        
                    </table>
                    <p>Your wallet balance has been updated accordingly, reflecting the deduction for the ticket purchase. </p>
                    <p> You are now registered for the event or activity associated with the ticket type.</p>
        
                    <p>If you have any questions or concerns regarding this ticket purchase, please feel free to contact our</p>
                    <p>  support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
        
                    <p>Thank you for choosing STRING ARC8. We hope you enjoy the event and have a great experience!</p>
                    <div style="margin: 40px 0 50px;">
                    <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                        target="_blank">Contact Us</a>
                </div>
                    <p>Best regards,</p>
                    <p>The STRING ARC8 Team</p>
        
                    <br>
                </div>
                <div>
                    <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                            href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                        of email, Don’t want any more emails from String Arc8?<a
                        href="mailto:${supportEmail}">Unsubscribe</a></p>
                    <footer>
                              <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                    </footer>
                </div>
            </div>
        </body>
        
        </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemailer.email,
      to: email,
      subject: "Ticket Purchase Confirmation",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailApproveWithdrawRequest: async (
    email,
    name,
    amount,
    time,
    walletAddress
  ) => {
    let html = `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #fbf2f2;
                    }
            
                    .main-container {
                        max-width: 600px;
            
                        margin: 0 auto;
                        padding: 30px;
                        background-color: #211124;
                        border-radius: 5px;
                        overflow: hidden;
            
                    }
            
                    .container {
                        max-width: 100%;
            
                        margin-top: 10px;
                        padding: 20px;
                        background-color: #190c1b;
                        border-radius: 5px;
                    }
            
                    header {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    img {
                        max-width: 100%;
            
                    }
            
                    tr {
                        padding-bottom: 10px;
                       
                    }
            
                    h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    td {
                        font-size: 14px;
                    }
                    .contactbutton {
                        border: 1px solid #b120c9 !important;
                        background: #19051c !important;
                        box-shadow: inset 0 0 10px 0 #580665 !important;
                        color: #fff !important;
                        padding: 13px 30px;
                        border-radius: 10px;
                        margin-bottom: 24px;
                        margin-top: 10px;
                        text-decoration: none;
                        font-size: 14px;
                    }
                    tr {
                        font-size: 14px;
                    }
            
                    th {
                        font-size: 14px;
                    }
            
                    p {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    td {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    .otp-code {
                        display: flex;
                        justify-content: center;
                        margin: 10px auto;
                        color: #fbf2f2;
                    }
            
                    .otp-code h3 {
                        font-size: 24px;
                        margin: 0 10px;
                        text-align: center;
                        color: #fbf2f2;
                    }
            
                    footer {
                        border-top: 1px solid #5f5858;
                        padding-top: 20px;
                        text-align: center;
                    }
            
                    a {
                        text-decoration: underline;
                    }
            
                    @media only screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
            
                        header {
                            text-align: center;
                        }
            
                        h2 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
            
                        .otp-code h3 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
                    }
                </style>
            </head>
            
            <body>
                <div class="main-container">
                    <div class="container">
                        <header>
                            <div style="display: flex; align-items: center; justify-content: center;">
                                <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                                    alt="ARC8" width="70px" height="70px">
                                <h2 style="margin-bottom: 30px;">String Arc8</h2>
                            </div>
                        </header>
                        <h2> Withdrawal Request Confirmation -</h2> 
                                <h2> STRING ARC8</h2>
                                 <p>Dear ${name}👋</p>
                                 <p> We're writing to confirm that your withdrawal request on STRING ARC8 has been successfully processed. Below are the details of your withdrawal </p>
                              
            
            
            <hr>
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left;">Amount Withdraw</td>
                                <td style="text-align: right;">${amount}</td>
            
                            </tr>
                            <tr>
                                <td style="text-align: left;">Date and Time</td>
                                <td style="text-align: right;">${time}</td>
            
                            </tr>
                           
                            <tr>
                                <td>Withdrawal Address</td>
                                <td style="text-align: right;">${walletAddress}</td>
            
                            </tr>
                            
            
                        </table>
                        <p>The withdrawn amount has been transferred to your designated account or payment method. Please allow [X business days] for the funds to reflect in your account, depending on your withdrawal method and banking institution.</p>
                                    
                        <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                        
                        <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                        <div style="margin: 40px 0 50px;">
                        <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                            target="_blank">Contact Us</a>
                    </div>
                        <p>Best regards,</p>
                        <p>The STRING ARC8 Team</p>
            
                        <br>
                    </div>
                    <div>
                        <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                                href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                            of email, Don’t want any more emails from String Arc8?<a
                            href="mailto:${supportEmail}">Unsubscribe</a></p>
                        <footer>
                                  <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                        </footer>
                    </div>
                </div>
            </body>
            
            </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Withdrawal Request Confirmation",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailCreateWithdrawRequest: async (
    email,
    name,
    amount,
    time,
    walletAddress
  ) => {
    let html = `<!DOCTYPE html>
            <html lang="en">
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body {
                        font-family: sans-serif;
                        margin: 0;
                        padding: 0;
                        color: #fbf2f2;
                    }
            
                    .main-container {
                        max-width: 600px;
            
                        margin: 0 auto;
                        padding: 30px;
                        background-color: #211124;
                        border-radius: 5px;
                        overflow: hidden;
            
                    }
            
                    .container {
                        max-width: 100%;
            
                        margin-top: 10px;
                        padding: 20px;
                        background-color: #190c1b;
                        border-radius: 5px;
                    }
            
                    header {
                        text-align: center;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    img {
                        max-width: 100%;
            
                    }
            
                    tr {
                        padding-bottom: 10px;
                       
                    }
            
                    h2 {
                        font-size: 24px;
                        margin-bottom: 20px;
                        color: #fbf2f2;
                    }
            
                    td {
                        font-size: 14px;
                    }
                    .contactbutton {
                        border: 1px solid #b120c9 !important;
                        background: #19051c !important;
                        box-shadow: inset 0 0 10px 0 #580665 !important;
                        color: #fff !important;
                        padding: 13px 30px;
                        border-radius: 10px;
                        margin-bottom: 24px;
                        margin-top: 10px;
                        text-decoration: none;
                        font-size: 14px;
                    }
                    tr {
                        font-size: 14px;
                    }
            
                    th {
                        font-size: 14px;
                    }
            
                    p {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    td {
                        margin-bottom: 15px;
                        line-height: 1.5;
                        color: #fbf2f2;
                    }
                    .otp-code {
                        display: flex;
                        justify-content: center;
                        margin: 10px auto;
                        color: #fbf2f2;
                    }
            
                    .otp-code h3 {
                        font-size: 24px;
                        margin: 0 10px;
                        text-align: center;
                        color: #fbf2f2;
                    }
            
                    footer {
                        border-top: 1px solid #5f5858;
                        padding-top: 20px;
                        text-align: center;
                    }
            
                    a {
                        text-decoration: underline;
                    }
            
                    @media only screen and (max-width: 600px) {
                        .container {
                            padding: 15px;
                        }
            
                        header {
                            text-align: center;
                        }
            
                        h2 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
            
                        .otp-code h3 {
                            font-size: 20px;
                            color: #fbf2f2;
                        }
                    }
                </style>
            </head>
            
            <body>
                <div class="main-container">
                    <div class="container">
                        <header>
                            <div style="display: flex; align-items: center; justify-content: center;">
                                <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                                    alt="ARC8" width="70px" height="70px">
                                <h2 style="margin-bottom: 30px;">String Arc8</h2>
                            </div>
                        </header>
                        <h2> Withdrawal Request  -</h2> 
                                <h2> STRING ARC8</h2>
                                 <p>Dear ${name}👋</p>
                                 <p> We're writing to confirm that your withdrawal request on STRING ARC8 has been in processing. Below are the details of your withdrawal </p>
                              
            
            
            <hr>
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: left;">Amount Withdraw</td>
                                <td style="text-align: right;">${amount}</td>
            
                            </tr>
                            <tr>
                                <td style="text-align: left;">Date and Time</td>
                                <td style="text-align: right;">${time}</td>
            
                            </tr>
                           
                            <tr>
                                <td>Withdrawal Address</td>
                                <td style="text-align: right;">${walletAddress}</td>
            
                            </tr>
                            
            
                        </table>
                        <p>The withdrawn request has been confirmed by the admin. Please allow few days for the funds to reflect in your account, depending on your withdrawal method and banking institution.</p>
                                    
                        <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                        
                        <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                        <div style="margin: 40px 0 50px;">
                        <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                            target="_blank">Contact Us</a>
                    </div>
                        <p>Best regards,</p>
                        <p>The STRING ARC8 Team</p>
            
                        <br>
                    </div>
                    <div>
                        <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                                href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                            of email, Don’t want any more emails from String Arc8?<a
                            href="mailto:${supportEmail}">Unsubscribe</a></p>
                        <footer>
                                  <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                        </footer>
                    </div>
                </div>
            </body>
            
            </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Withdrawal Request",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  sendEmailRejectWithdrawRequest: async (email, name, reason) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
               <h2> Withdrawal Request Rejected -</h2> 
               <h2> STRING ARC8</h2>
                <p>Dear ${name}👋</p>
                <p> We're writing to confirm that your withdrawal request on STRING ARC8 has been rejected. Below are the reason of your withdrawal rejection </p>
                <p>Reason is :${reason}</p>
                <p>If you have any questions or concerns regarding this withdrawal, please feel free to contact our support team at [Support Email]. We're here to assist you with any inquiries you may have.</p>
                
                <p>Thank you for choosing [Game Website]. We hope you continue to enjoy your gaming experience with us!</p>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                    target="_blank">Contact Us</a>
            </div>
                <p>Best regards,</p>
                <p>The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailer.password,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Withdrawal Request Rejected",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailOtpFOR2FA: async (email, otp, userName) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>OTP Verification for  Email 2FA STRING ARC8</h2>
            <p>${userName}</p>
            <p>Thank you for signing up with STRING ARC8. To ensure the security of your account, we require you to
                verify your otp .</p>
            <p>Please use the following One-Time Password (OTP) to complete the verification process:</p>
            <div class="otp-code">
                <h3>${otp}</h3>
            </div>
            <p>Please note that this OTP is valid for a limited time period (for 3 minutes). If you did not request this
                verification, please disregard this email.</p>
            <p>Thank you for choosing STRING ARC8. If you have any questions or need further assistance, feel free to
                contact our support team.</p><br>
                <div style="margin: 40px 0 50px;">
                <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
                    target="_blank">Contact Us</a>
            </div>
            <p>Best regards,</p>
            <p>The STRING ARC8 Team</p><br>
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>
    `;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "OTP Verification for Email 2FA",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  sendMailForDelete: async (to, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>Your STRING ARC8  Account Permanent Suspended.</h2>
           <p> Dear ${name},</p>
            
           <p> We regret to inform you that your account on STRING ARC8 has been permanent blocked by our administrative team .</p>
            
           <p> As a result, you will no longer be able to access your account or its associated features .</p>
            
           <p> Thank you for your understanding.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
           <p> Best regards,</p>
           <p> The STRING ARC8 Team</p>
            
           
            
           
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>
    `;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: "Your STRING ARC8  Account Permanent Suspended",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendEmailForConnectWallet: async (email, name, wallet) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }

        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
    </head>
    
    <body>
        <div class="main-container">
            <div class="container">
                <header>
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                            alt="ARC8" width="70px" height="70px">
                        <h2 style="margin-bottom: 30px;">String Arc8</h2>
                    </div>
                </header>
               <h2> Wallet Connected to STRING ARC8!</h2>
<p>Dear ${name},</p>

<p>Your wallet  ${wallet} is connected with STRING ARC8!</p>

<p>If you want to change your connected wallet then contact with Admin</p>

<p>We're thrilled to have you join our gaming community. Get ready for an exciting adventure filled with thrilling games, engaging challenges, and endless fun!</p>

<p>Here's a quick overview of what you can expect from your STRING ARC8 experience:</p>

<p>Explore a Variety of Games: Dive into a diverse collection of games ranging from action-packed adventures to brain-teasing puzzles. With new releases and updates regularly added, there's always something fresh to enjoy.</p>

<p>Connect with Players: Engage with fellow gamers from around the world. Whether you're looking for allies to conquer quests or rivals to challenge, our vibrant community is always ready to connect.</p>

<p>Unlock Achievements and Rewards: Set goals, complete challenges, and earn rewards! As you progress through games, unlock achievements, and level up your skills, you'll discover exciting rewards waiting for you.</p>

<p>Stay Updated: Don't miss out on the latest news, events, and special offers. Keep an eye on your inbox for updates, promotions, and exclusive content tailored just for you.</p>

<p>To kick-start your gaming journey, we've included a special bonus just for new players.</p>

<p>Ready to start playing? Simply log in to your account and explore the world of STRING ARC8 today!</p>

<p>If you have any questions or need assistance, our support team is here to help. Feel free to reach out to us at support@STRING ARC8.com anytime.</p>
<div style="margin: 40px 0 50px;">
<a type="button" class="contactbutton" href="https://stringarc8.io/contactcontact"
    target="_blank">Contact Us</a>
</div>
<p>Best regards,</p>
<p>The STRING ARC8 Team</p>
               
               <br>
            </div>
            <div>
                <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                        href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                    of email, Don’t want any more emails from String Arc8?<a
                    href="mailto:${supportEmail}">Unsubscribe</a></p>
                <footer>
                          <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
                </footer>
            </div>
        </div>
    </body>
    
    </html>`;
    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: process.env.nodemaileremail,
      to: email,
      subject: "Wallet Connected STRING ARC8!",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },

  sendMailForLoginActivity: async (to, name) => {
    let html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            color: #fbf2f2;
        }

        .main-container {
            max-width: 600px;

            margin: 0 auto;
            padding: 30px;
            background-color: #211124;
            border-radius: 5px;
            overflow: hidden;
            /* Added to handle potential overflow */
        }

        .container {
            max-width: 100%;
            /* Adjusted to full width on smaller screens */
            max-height: 1000px;
            margin-top: 10px;
            padding: 20px;
            background-color: #190c1b;
            border-radius: 5px;
        }

        header {
            text-align: center;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        img {
            max-width: 100%;
            /* Added to make the image responsive */
            height: auto;
            /* Added to maintain aspect ratio */
        }

        h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fbf2f2;
        }

        p {
            margin-bottom: 15px;
            line-height: 1.5;
            color: #fbf2f2;
        }

        .otp-code {
            display: flex;
            justify-content: center;
            margin: 10px auto;
            color: #fbf2f2;
        }
        .contactbutton {
            border: 1px solid #b120c9 !important;
            background: #19051c !important;
            box-shadow: inset 0 0 10px 0 #580665 !important;
            color: #fff !important;
            padding: 13px 30px;
            border-radius: 10px;
            margin-bottom: 24px;
            margin-top: 10px;
            text-decoration: none;
            font-size: 14px;
        }
        .otp-code h3 {
            font-size: 24px;
            margin: 0 10px;
            text-align: center;
            color: #fbf2f2;
        }

        footer {
            border-top: 1px solid #5f5858;
            padding-top: 20px;
            text-align: center;
        }

        a {
            text-decoration: underline;
        }

        @media only screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            header {
                text-align: center;
            }

            h2 {
                font-size: 20px;
                color: #fbf2f2;
            }

            .otp-code h3 {
                font-size: 20px;
                color: #fbf2f2;
            }
        }
    </style>
</head>

<body>
    <div class="main-container">
        <div class="container">
            <header>
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098490/sum3frgczbscsussmvjm.png"
                        alt="ARC8" width="70px" height="70px">
                    <h2 style="margin-bottom: 30px;">String Arc8</h2>
                </div>
            </header>
            <h2>STRING ARC8 Login Activity Notification</h2>
            <p>Dear ${name}</p>
           <p> We're reaching out to inform you about recent login activity on your STRING ARC8 account. Here are the details of the login activity:</p>
            
           <p>  Date and Time:   [Date and Time of Login]</p>
           <p>  Location:               [Location of Login]</p>
           <p>  Device:                   [Device Used for Login]</p>
           <p>  IP Address:           [IP Address Used for Login]
</p>
           <p> If you recognize this login activity and it was initiated by you, there's no need to take any action. However, if you do not recognize this login or suspect any unauthorized access to your account, please take the following steps immediately:</p>
            
           <p> Change your password: Go to your account settings on [Game Website] and update your password to a strong and unique one.
</p>
           <p> Review your account activity: Check for any unauthorized changes or activities within your account history.</p>
            
           <p> Contact support: If you believe your account security has been compromised; please contact our support team at [Support Email] for further assistance.</p>
            
           <p> Please note that ensuring the security of your account is our top priority, and we take proactive measures to protect your information.</p>
            
           <p>Thank you for your attention to this matter.</p>
           <div style="margin: 40px 0 50px;">
           <a type="button" class="contactbutton" href="https://stringarc8.io/contact"
               target="_blank">Contact Us</a>
       </div>
     
   
       
           <p>Best regards,</p>
           <p> The STRING ARC8 Team</p>
            
            
           
            </div>
            <div>
            <p style="font-size:13px; color: #9e9c9c;">Questions or faq? Contact us at <a
                    href="mailto:${supportEmail}">Support@abc.com</a>. If you'd rather not receive this kind
                of email, Don’t want any more emails from String Arc8?<a
                href="mailto:${supportEmail}">Unsubscribe</a></p>
            <footer>
                      <footer>
                <div style="text-align: center; font-size:13px; color: #9e9c9c; margin-bottom: 10px;">
            <a href="https://stringarc8.io/static/about?termsConditions" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Terms & Condition</a> |
            <a href="https://stringarc8.io/static/about?privacyPolicy" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Privacy Policy</a> |
            <a href="https://stringarc8.io/contact" style="text-decoration: none; color: #9e9c9c; margin-right: 10px; margin-left: 10px;">Contact Support</a>
        </div>
                  <p style="font-size:12px; color: #9e9c9c;">Shop No. 22/27, Poultry Market, Commerical Street, <br>Bangalore
     </p> 
                </footer>
 </p> 
            </footer>
        
        </div>
    </body>
    
    </html>
    `;

    var transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,

      logger: true,
      auth: {
        user: process.env.nodemaileremail,
        pass: process.env.nodemailerpassword,
      },
    });
    var mailOptions = {
      from: "support@stringarc8.io",
      to: to,
      subject: "STRING ARC8 Login Activity Notification",
      html: html,
    };
    return await transporter.sendMail(mailOptions);
  },
  uploadImage(image) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(image, function (error, result) {
        console.log(result);
        if (error) {
          reject(error);
        } else {
          resolve(result.url);
        }
      });
    });
  },
};
