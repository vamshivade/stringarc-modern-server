import Joi from "joi";
import Mongoose, { Promise } from "mongoose";

import _ from "lodash";
import config from "config";
const speakeasy = require("speakeasy");
const bodyParser = require("body-parser");
let qrcode = require("qrcode");
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
var QRCode = require("qrcode");
import responseMessage from "../../../../../assets/responseMessage";
import userModel from "../../../../models/user";
import commonFunction from "../../../../helper/util";
import cryptoFunction from "../../../../helper/cryptoUtils";
import jwt from "jsonwebtoken";
import status from "../../../../enums/status";
import winStatus from "../../../../enums/winStatus";
import userType from "../../../../enums/userType";
import { ticketServices } from "../../services/ticket";

const crypto = require("crypto");

const {
  findTicket,
  updateTicket,
  paginateTicket,
  ticketList,
  createTicket,
} = ticketServices;


import { blockedUserServices } from "../../services/blockedUserName";
const {
  blockUserName,
  findBlockedUserNameData,
  findBlockedUserName,
  updateBlockedUserNameById,
  paginateBlockedUserNameSearch,
} = blockedUserServices;
import { gameServices } from "../../services/game";
const {
  createGame,
  gameCheck,
  findGame,
  updateGame,
  paginateGame,
  updateGameById,
} = gameServices;
import { gameHistoryServices } from "../../services/gameHistory";
const {
  createGameHistory,
  findGameHistory,
  gameHistoryCount,
  updateGameHistory,
  paginateGameHistory,
  updateGameHistoryById,
  aggregateLeaderBoard,
  findAllGameHistory,
  paginateGameScore,
} = gameHistoryServices;

import { transactionServices } from "../../services/transaction";
const {
  graphTransactionAggrigate,
  transactionCount,
  findTransactions,
} = transactionServices;

import { contactUsServices } from "../../services/contactUs";
const { createContactUs, getAllContactUs, viewContactUs } = contactUsServices;
import { userServices } from "../../services/user";
const {
  userCheck,
  checkUserExists,
  emailExist,
  createUser,
  userCount,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateUserById,
  paginateSearch,
} = userServices;
const { generateWallet } = require("../../../../helper/bip39");
import { userActivityServices } from "../../services/userActivity";
import { valid } from "joi/lib/types/date";
import adminSettings from "../../../../models/adminSettings";
const {
  createUserActivity,
  userActivityCount,
  paginateSearchActivity,
  findUserActivityData,
} = userActivityServices;
const {
  createReferralHistory
} = ReferralHistoryServices;


import { ReferralHistoryServices } from "../../services/refferalHistory";
export class userController {
  /**
   * @swagger
   * /user/signup:
   *   post:
   *     tags:
   *       - USER
   *     description: signup
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: signup
   *         description: signup
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/signup'
   *     responses:
   *       200:
   *         description: Returns success message
   */


  async signup(req, res, next) {
    try {
      const userData = req.userData;

    
      const { id, first_name, photo_url } = userData;

  
      const userName = first_name;
      const profilePic = photo_url;

      var validationSchema = {
        data: Joi.object().required(),
   
      };
  

      var validatedBody = await Joi.validate(req.body, validationSchema);
   
 
      const AdminSettings = await adminSettings.findOne();
      if (!AdminSettings)
        throw apiError.badRequest("Unable to fetch referral Ticket Balance");
      let referralUser = await findUserData({ chatId: validatedBody.data.referrerChatId })
      

      if (validatedBody.data.referrerChatId && !referralUser)
        throw apiError.badRequest("Invalid referral");
      const newUser = await createUser({
        chatId: id,
        userName,
        userType: "USER",
        status: "ACTIVE",
        wallet: null,
        private_key: null,
        profilePic,
      });

      if (referralUser) {
        await updateUser(
          { _id: referralUser._id },
          { $inc: { ticketBalance: AdminSettings.referralTicketBalance } }
        );

        await createReferralHistory({
          userId: newUser._id,
          ReferredBy: referralUser._id,
          Referral_Amount: AdminSettings.referralTicketBalance,
          InitialBalance: referralUser.ticketBalance || 0,
          FinalBalance:
            (referralUser.ticketBalance || 0) +
            AdminSettings.referralTicketBalance,
        });
      }
      const user = new response(newUser);

      const token = await commonFunction.getToken({
        _id: user._id,
        chatId: user.chatId,
        userType: user.userType,
      });
   
      return res.status(200).json({
        message: "User created successfully",
        data: user,
        token: token,
      });
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/verifyOTPSignUp:
   *   patch:
   *     tags:
   *       - USER
   *     description: verifyOTPSignUp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verifyOTPSignUp(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, otp } = validatedBody;
      var userResult = await findUserData({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      if (userResult.otpVerified === false) {
        await commonFunction.sendEmailForWelcome(
          userResult.email,
          userResult.firstName
        );
      }
      var updateResult = await updateUser(
        {
          _id: userResult._id,
        },
        {
          otpVerified: true,
        }
      );

      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/verifyOTP:
   *   patch:
   *     tags:
   *       - USER
   *     description: verifyOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verifyOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, otp } = validatedBody;

      var userResult = await findUserData({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var updateResult = await updateUser(
        {
          _id: userResult._id,
        },
        {
          otpVerified: true,
        }
      );

      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags:
   *       - USER
   *     description: login with email and password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: login
   *         description: login
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/login'
   *     responses:
   *       200:
   *         description: Returns success message
   */


  async login(req, res, next) {
    try {
      const userData = req.userData;

 
      const { id } = userData;

      const chatId = id;



      if (!chatId) {
        return res
          .status(400)
          .json(new response(null, responseMessage.INVALID_CHAT_ID));
      }


      let userResult = await userModel.findOne({ chatId });
   
      if (!userResult) {
        throw apiError.badRequest(responseMessage.USER_NOT_FOUND);
      }


      if (userResult.status === "BLOCK") {
        throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
      }
      if (userResult.status === "DELETE") {
        throw apiError.badRequest(responseMessage.DELETE_BY_ADMIN);
      }

      const token = await commonFunction.getToken({
        _id: userResult._id,
        chatId: userResult.chatId,
        userType: userResult.userType,
      });

      const results = {
        _id: userResult._id,
        chatId: userResult.chatId,
        userType: userResult.userType,
        token,
      };

      console.log("Login Success: ", results);

      return res.json(new response(results, responseMessage.LOGIN));

    } catch (error) {
      console.error("Error during login:", error.message);
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/verify2Falogin:
   *   post:
   *     tags:
   *       - USER
   *     description: verify2Falogin with email and password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: otp
   *         description: otp
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verify2Falogin(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.number().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }

      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, otp } = validatedBody;
      let userResult = await findUser({
        email: email,
        status: {
          $ne: status.DELETE,
        },
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (userResult.status == status.BLOCK) {
        throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
      }
      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.emailotp2FA != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var token = await commonFunction.getToken({
        _id: userResult._id,
        email: userResult.email,
        mobileNumber: userResult.mobileNumber,
        userType: userResult.userType,
      });
      var obj = {
        _id: userResult._id,
        name: userResult.name,
        email: userResult.email,
        countryCode: userResult.countryCode,
        mobileNumber: userResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY_2FA));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/forgotPassword:
   *   post:
   *     tags:
   *       - USER
   *     description: forgotPassword by USER on plateform when he forgot password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: forgotPassword
   *         description: forgotPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/forgotPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async forgotPassword(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email } = validatedBody;
      var userResult = await findUser({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendEmailForgotPassOtp(
          userResult.email,
          otp,
          userResult.firstName
        );
        var updateResult = await updateUser(
          {
            _id: userResult._id,
          },
          {
            $set: {
              otp: newOtp,
              otpExpireTime: time,
            },
          }
        );
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), [
          "otp",
          "password",
          "base64",
          "secretGoogle",
          "emailotp2FA",
          "withdrawOtp",
          "password",
        ]);

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/changePassword:
   *   patch:
   *     tags:
   *       - USER
   *     description: changePassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: changePassword
   *         description: changePassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/changePassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async changePassword(req, res, next) {
    const validationSchema = {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      let updated = await updateUserById(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      updated = _.omit(JSON.parse(JSON.stringify(updated)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);
      await commonFunction.sendEmailForPasswordChangeSuccess(
        userResult.email,
        userResult.firstName
      );
      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resetPassword:
   *   post:
   *     tags:
   *       - USER
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resetPassword'
   *     responses:
   *       200:
   *         description: Your password has been successfully changed.
   *       404:
   *         description: This user does not exist.
   *       422:
   *         description: Password not matched.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resetPassword(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    };
    try {
      const { password, confirmPassword } = await Joi.validate(
        req.body,
        validationSchema
      );

      var userResult = await findUser({
        email: req.body.email,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        if (password == confirmPassword) {
          let update = await updateUser(
            {
              _id: userResult._id,
            },
            {
              password: bcrypt.hashSync(password),
            }
          );
          update = _.omit(JSON.parse(JSON.stringify(update)), [
            "otp",
            "password",
            "base64",
            "secretGoogle",
            "emailotp2FA",
            "withdrawOtp",
            "password",
          ]);
          await commonFunction.sendEmailForPasswordResetSuccess(
            userResult.email,
            userResult.firstName
          );

          return res.json(new response(update, responseMessage.PWD_CHANGED));
        } else {
          throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
        }
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resendOtp:
   *   post:
   *     tags:
   *       - USER
   *     description: resend otp by user on plateform when he resend otp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resendOtp
   *         description: resendOtp
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resendOtp'
   *     responses:
   *       200:
   *         description: OTP send successfully.
   *       404:
   *         description: This user does not exist.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resendOtp(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email } = validatedBody;
      var userResult = await findUser({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            $or: [
              {
                mobileNumber: email,
              },
              {
                email: email,
              },
            ],
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendEmailOtp(
          userResult.email,
          otp,
          userResult.firstName
        );
        var updateResult = await updateUser(
          {
            _id: userResult._id,
          },
          {
            $set: {
              otp: newOtp,
              otpExpireTime: time,
            },
          }
        );
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), [
          "otp",
          "password",
          "base64",
          "secretGoogle",
          "emailotp2FA",
          "withdrawOtp",
          "password",
        ]);

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/uploadFile:
   *   post:
   *     tags:
   *       - UPLOAD-FILE
   *     description: uploadFile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: uploaded_file
   *         description: uploaded_file
   *         in: formData
   *         type: file
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async uploadFile(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const { files } = req;

      if (files.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      const imageFiles = await commonFunction.getImageUrl(files);

      if (imageFiles) {
        let obj = {
          secure_url: imageFiles,
          original_filename: files[0].filename,
        };
        return res.json(new response(obj, responseMessage.UPLOAD_SUCCESS));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/checkUserName:
   *   post:
   *     tags:
   *       - USER
   *     description: checkUserName
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: false
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: User details.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal server error.
   *       501:
   *         description: Something went wrong.
   */

  async checkUserName(req, res, next) {
    try {
      let blocked = await findBlockedUserName({
        "userName.userName": req.body.userName,
      });

      if (blocked) {
        throw apiError.notFound(responseMessage.USERNAME_BLOCKED);
      }
      let query = {
        userName: req.body.userName,
        otpVerified: true,
      };

      if (req.body._id) {
        query._id = {
          $ne: req.body._id,
        };
      }
      let userResult = await findUser(query);

      if (userResult) {
        throw apiError.notFound(responseMessage.USERNAME_TAKEN);
      }
      userResult = _.omit(JSON.parse(JSON.stringify(userResult)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(userResult, responseMessage.VALID_USERNAME));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getProfile:
   *   get:
   *     tags:
   *       - USER
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getProfile(req, res, next) {
    try {
      let adminResult = await findUser({
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let ticket = await findTicket();
      if (!ticket) {
        throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
      }
      let adminsetting = await adminSettings.findOne();
      if (!adminsetting) {
        throw apiError.notFound("setting Not found");
      }
      userResult = _.omit(JSON.parse(JSON.stringify(userResult)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
        "private_key"
      ]);
      if (adminResult.wallet) {

        userResult.adminWallet = adminResult.wallet;

      }
      if (adminsetting) {
        userResult.Referral_Note = adminsetting.Referral_Note
        userResult.Bot_Name = adminsetting.Bot_Name
        userResult.referralTicketBalance = adminsetting.referralTicketBalance
      }
      userResult.adminDWallet = ticket.defaultAdminWallet;

      return res.json(new response(userResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/editProfile:
   *   put:
   *     tags:
   *       - USER
   *     description: editProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         required: false
   *       - name: bannerPic
   *         description: bannerPic
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: wallet
   *         description: wallet
   *         in: formData
   *         required: false
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: false
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: false
   *       - name: bio
   *         description: bio
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfile(req, res, next) {
    const validationSchema = {
      userName: Joi.string().optional(),
      profilePic: Joi.string().allow("").optional(),

    };
    try {


      // Validate request body
      const validatedBody = await Joi.validate(req.body, validationSchema)

      // Find the user by ID
      let userResult = await findUser({
        _id: req.userId,
        status: { $ne: status.DELETE },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      // **Only check email existence if email is being updated**
      if (validatedBody.userName) {
        let userExist = await emailExist(validatedBody.userName, userResult._id);
        if (userExist) {
          throw apiError.conflict("UserName Already Exist");
        }
      }

      // Handle profilePic and bannerPic updates
      if (validatedBody.profilePic && validatedBody.profilePic !== "") {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }

      if (
        validatedBody.userName &&
        validatedBody.userName !== userResult.userName
      ) {
        let obj = {
          userId: userResult._id,
          type: "USERNAME",
          old: userResult.userName,
          new: validatedBody.userName,
        };
        await createUserActivity(obj);
      }

      if (
        validatedBody.firstName &&
        validatedBody.firstName !== userResult.firstName
      ) {
        let obj = {
          userId: userResult._id,
          type: "FIRSTNAME",
          old: userResult.firstName,
          new: validatedBody.firstName,
        };
        await createUserActivity(obj);
      }

      if (
        validatedBody.lastName &&
        validatedBody.lastName !== userResult.lastName
      ) {
        let obj = {
          userId: userResult._id,
          type: "LASTNAME",
          old: userResult.lastName,
          new: validatedBody.lastName,
        };
        await createUserActivity(obj);
      }

      // Update the user with validatedBody
      var result = await updateUser({ _id: userResult._id }, validatedBody);

      // Omit sensitive fields from the response
      result = _.omit(JSON.parse(JSON.stringify(result)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      console.error("Error in editProfile:", error); // For debugging
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/isChange:
   *   put:
   *     tags:
   *       - USER
   *     description: isChange
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async isChange(req, res, next) {
    try {
      let validatedBody = {};
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      validatedBody.changeUserName = true;
      validatedBody.changeFirstName = true;
      validatedBody.changeLastName = true;

      let userNameDaysLeft = 0;
      let firstNameDaysLeft = 0;
      let lastNameDaysLeft = 0;
      let date = new Date();
      var pastDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
      let changeUserName = await userActivityCount({
        userId: req.userId,
        type: "USERNAME",
        createdAt: {
          $gt: pastDate,
        },
      });

      let changeUserNameDoc = await findUserActivityData({
        userId: req.userId,
        type: "USERNAME",
        createdAt: {
          $gt: pastDate,
        },
      });

      let currentDate = new Date();
      if (changeUserName > 1) {
        validatedBody.changeUserName = false;
        let firstDate = changeUserNameDoc[0].createdAt;
        let next30Days = new Date(
          firstDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        let timeDifference = next30Days.getTime() - currentDate.getTime();
        let daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        userNameDaysLeft = daysDifference;
      }

      let changeFirstName = await userActivityCount({
        userId: req.userId,
        type: "FIRSTNAME",
        createdAt: {
          $gt: pastDate,
        },
      });

      let changeFirstNameDoc = await findUserActivityData({
        userId: req.userId,
        type: "FIRSTNAME",
        createdAt: {
          $gt: pastDate,
        },
      });

      if (changeFirstName > 1) {
        validatedBody.changeFirstName = false;
        let firstDate = changeFirstNameDoc[0].createdAt;
        let next30Days = new Date(
          firstDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        let timeDifference = next30Days.getTime() - currentDate.getTime();
        let daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        firstNameDaysLeft = daysDifference;
      }

      let changeLastName = await userActivityCount({
        userId: req.userId,
        type: "LASTNAME",
        createdAt: {
          $gt: pastDate,
        },
      });
      let changeLastNameDoc = await findUserActivityData({
        userId: req.userId,
        type: "LASTNAME",
        createdAt: {
          $gt: pastDate,
        },
      });

      if (changeLastName > 1) {
        validatedBody.changeLastName = false;
        let firstDate = changeLastNameDoc[0].createdAt;
        let next30Days = new Date(
          firstDate.getTime() + 30 * 24 * 60 * 60 * 1000
        );
        let timeDifference = next30Days.getTime() - currentDate.getTime();
        let daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        lastNameDaysLeft = daysDifference;
      }

      var result = await updateUser(
        {
          _id: userResult._id,
        },
        validatedBody
      );
      result = _.omit(JSON.parse(JSON.stringify(result)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      result.changeUserNameCount = changeUserName;
      result.changeFirstNameCount = changeFirstName;
      result.changeLastNameCount = changeLastName;
      result.userNameDaysLeft = userNameDaysLeft;
      result.firstNameDaysLeft = firstNameDaysLeft;
      result.lastNameDaysLeft = lastNameDaysLeft;

      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/graphDWUser:
   *   get:
   *     tags:
   *       - USER
   *     description: graphData User
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphDWUser(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: status.ACTIVE,
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      var m_names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      var currentDay = new Date();
      let weekDataRes = [];
      var daysOfWeek = [];
      let yearDataRes = [];
      if (req.query.data == "MONTH" || req.query.data == "DAYS") {
        let days = 0;
        if (req.query.data == "MONTH") {
          days = 30;
        } else {
          days = 60;
        }
        var weekDate = new Date(
          new Date().getTime() - 24 * Number(days) * 60 * 60 * 1000
        );
        for (
          var d = new Date(weekDate);
          d <= currentDay;
          d.setDate(d.getDate() + 1)
        ) {
          daysOfWeek.push(new Date(d));
        }

        for (let i = 0; i < daysOfWeek.length; i++) {
          let startTime = new Date(
            new Date(daysOfWeek[i]).toISOString().slice(0, 10)
          );
          let lastTime = new Date(
            new Date(daysOfWeek[i]).toISOString().slice(0, 10) +
            "T23:59:59.999Z"
          );
          let [buy, withdraw, rejected] = await Promise.all([
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "BUY",
                },
                {
                  status: "APPROVE",
                },
              ],
            }),
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "WITHDRAW",
                },
                {
                  status: "APPROVE",
                },
              ],
            }),
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "WITHDRAW",
                },
                {
                  status: "REJECT",
                },
              ],
            }),
          ]);
          let buyAmount = 0;
          let withdrawAmount = 0;
          let rejectedAmount = 0;
          if (buy.length != 0) {
            buyAmount = buy
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          if (withdraw.length != 0) {
            withdrawAmount = withdraw
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          if (rejected.length != 0) {
            rejectedAmount = rejected
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          let objDb = {
            buy: buyAmount,
            withdraw: withdrawAmount,
            rejected: rejectedAmount,
            date: daysOfWeek[i],
          };
          weekDataRes.push(objDb);
        }
        return res.json(new response(weekDataRes, responseMessage.DATA_FOUND));
      } else {
        for (let i = 0; i < 12; i++) {
          let dataRes = new Date().setMonth(new Date().getMonth() - i);
          var startTime = new Date(
            new Date(dataRes).getFullYear(),
            new Date(dataRes).getMonth(),
            1
          );
          var lastTime = new Date(
            new Date(dataRes).getFullYear(),
            new Date(dataRes).getMonth() + 1,
            0
          );
          let [buy, withdraw, rejected] = await Promise.all([
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "BUY",
                },
                {
                  status: "APPROVE",
                },
              ],
            }),
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "WITHDRAW",
                },
                {
                  status: "APPROVE",
                },
              ],
            }),
            findTransactions({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  userId: user._id,
                },
                {
                  transactionType: "WITHDRAW",
                },
                {
                  status: "REJECT",
                },
              ],
            }),
          ]);
          let buyAmount = 0;
          let withdrawAmount = 0;
          let rejectedAmount = 0;
          if (buy.length != 0) {
            buyAmount = buy
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          if (withdraw.length != 0) {
            withdrawAmount = withdraw
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          if (rejected.length != 0) {
            rejectedAmount = rejected
              .map((o) => o.amount)
              .reduce((a, c) => {
                return Number(a) + Number(c);
              });
          }
          let objDb = {
            buy: buyAmount,
            withdraw: withdrawAmount,
            rejected: rejectedAmount,
            month: new Date(dataRes).getMonth() + 1,
            year: new Date(dataRes).getFullYear(),
            monthName: m_names[new Date(dataRes).getMonth()],
          };
          yearDataRes.push(objDb);
        }
        return res.json(
          new response(yearDataRes.reverse(), responseMessage.DATA_FOUND)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/graphGameHistoryUser:
   *   get:
   *     tags:
   *       - USER
   *     description: graphData User
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data
   *         in: query
   *         required: true
   *       - name: gameId
   *         description: gameId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphGameHistoryUser(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: status.ACTIVE,
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      let gameId = req.query.gameId;
      var m_names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      var currentDay = new Date();
      let weekDataRes = [];
      var daysOfWeek = [];
      let yearDataRes = [];
      if (req.query.data == "MONTH" || req.query.data == "DAYS") {
        let days = 0;
        if (req.query.data == "MONTH") {
          days = 30;
        } else {
          days = 60;
        }
        var weekDate = new Date(
          new Date().getTime() - 24 * Number(days) * 60 * 60 * 1000
        );
        for (
          var d = new Date(weekDate);
          d <= currentDay;
          d.setDate(d.getDate() + 1)
        ) {
          daysOfWeek.push(new Date(d));
        }

        for (let i = 0; i < daysOfWeek.length; i++) {
          let startTime = new Date(
            new Date(daysOfWeek[i]).toISOString().slice(0, 10)
          );
          let lastTime = new Date(
            new Date(daysOfWeek[i]).toISOString().slice(0, 10) +
            "T23:59:59.999Z"
          );

          let [WON, LOSS] = await Promise.all([
            findAllGameHistory({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  gameId: gameId,
                },
                {
                  userId: user._id,
                },
                {
                  playedStatus: "WON",
                },
              ],
            }),
            findAllGameHistory({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  gameId: gameId,
                },
                {
                  userId: user._id,
                },
                {
                  playedStatus: "LOSE",
                },
              ],
            }),
          ]);

          let wonAmount = 0;
          let lossAmount = 0;
          if (WON.length != 0) {
            wonAmount = WON.map((o) => o.prize).reduce((a, c) => {
              return Number(a) + Number(c);
            });
          }
          if (LOSS.length != 0) {
            lossAmount = LOSS.map((o) => o.betAmount).reduce((a, c) => {
              return Number(a) + Number(c);
            });
          }
          let objDb = {
            WON: wonAmount,
            LOSS: lossAmount,
            date: daysOfWeek[i],
          };
          weekDataRes.push(objDb);
        }
        return res.json(new response(weekDataRes, responseMessage.DATA_FOUND));
      } else {
        for (let i = 0; i < 12; i++) {
          let dataRes = new Date().setMonth(new Date().getMonth() - i);
          var startTime = new Date(
            new Date(dataRes).getFullYear(),
            new Date(dataRes).getMonth(),
            1
          );
          var lastTime = new Date(
            new Date(dataRes).getFullYear(),
            new Date(dataRes).getMonth() + 1,
            0
          );

          let [WON, LOSS] = await Promise.all([
            findAllGameHistory({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  gameId: gameId,
                },
                {
                  userId: user._id,
                },
                {
                  playedStatus: "WON",
                },
              ],
            }),
            findAllGameHistory({
              $and: [
                {
                  createdAt: {
                    $gte: new Date(startTime),
                  },
                },
                {
                  createdAt: {
                    $lte: new Date(lastTime),
                  },
                },
                {
                  gameId: gameId,
                },
                {
                  userId: user._id,
                },
                {
                  playedStatus: "LOSE",
                },
              ],
            }),
          ]);
          let wonAmount = 0;
          let lossAmount = 0;
          if (WON.length != 0) {
            wonAmount = WON.map((o) => o.prize).reduce((a, c) => {
              return Number(a) + Number(c);
            });
          }
          if (LOSS.length != 0) {
            lossAmount = LOSS.map((o) => o.betAmount).reduce((a, c) => {
              return Number(a) + Number(c);
            });
          }
          let objDb = {
            WON: wonAmount,
            LOSS: lossAmount,
            month: new Date(dataRes).getMonth() + 1,
            year: new Date(dataRes).getFullYear(),
            monthName: m_names[new Date(dataRes).getMonth()],
            month: new Date(dataRes).getMonth() + 1,
          };
          yearDataRes.push(objDb);
        }
        return res.json(
          new response(yearDataRes.reverse(), responseMessage.DATA_FOUND)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/editEmail2FA:
   *   post:
   *     tags:
   *       - USER
   *     description: editEmail2FA
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editEmail2FA(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var otp = await commonFunction.getOTP();
      var newOtp = otp;
      var time = Date.now() + 180000;
      var updateResult = await updateUser(
        {
          _id: userResult._id,
        },
        {
          $set: {
            emailotp2FA: newOtp,
            otpExpireTime: time,
          },
        }
      );
      await commonFunction.sendEmailOtpFOR2FA(
        userResult.email,
        otp,
        userResult.firstName
      );

      updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(updateResult, responseMessage.OTP_SEND_2FA));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verify2FAOTP:
   *   put:
   *     tags:
   *       - USER
   *     description: verify2FAOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: otp
   *         description: otp
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verify2FAOTP(req, res, next) {
    var validationSchema = {
      otp: Joi.number().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { otp } = validatedBody;

      var userResult = await findUserData({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            _id: req.userId,
          },
        ],
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.emailotp2FA != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var updateResult = await updateUser(
        {
          _id: userResult._id,
        },
        {
          email2FA: !userResult.email2FA,
          google2FA: false,
        }
      );
      let emailStatus;
      if (updateResult.email2FA == true) {
        emailStatus = "Enabled";
      } else {
        emailStatus = "Disabled";
      }


      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        email2FA: updateResult.email2FA,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY_2FA));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/enableTwoFactorGoogle:
   *   post:
   *     tags:
   *       - USER
   *     description: enableTwoFactorGoogle
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Two factor authentication enabled.
   *       401:
   *         description: Unauthorized token.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal server error.
   *       501:
   *         description: Something went wrong.
   */
  async enableTwoFactorGoogle(req, res, next) {
    try {
      let user;
      user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
      });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (user.google2FA === true) {
        let obj = {
          secret: user.secretGoogle,
          url: user.base64,
        };
        return res.json(new response(obj, "Google 2FA already enabled."));
      } else {
        // const secret = speakeasy.generateSecret();
        // let url =speakeasy.otpauthURL({ secret: secret.ascii, label: 'String Arc8', algorithm: 'sha512' })
        // const base64 = await new Promise((resolve, reject) => {

        //   QRCode.toDataURL(url, function (err, data_url) {
        //     if (err) {
        //       reject(err);
        //     } else {
        //       resolve(data_url);
        //     }
        //   });
        // });
        var secret = speakeasy.generateSecret({
          length: 20,
          name: "String Arc8",
        });
        let data_url = await qrcode.toDataURL(secret.otpauth_url);
        // if (!userResult.base32) {
        //     await updateUser({ _id: userResult._id }, { speakeasy: true, base32: secret.base32 })
        // }
        // let obj = {
        //     email: userResult.email,
        //     url: data_url,
        // }
        let data = await updateUser(
          {
            _id: user._id,
          },
          {
            secretGoogle: secret.base32,
            base64: data_url,
          }
        );
        let obj = {
          secret: data.secretGoogle,
          url: data.base64,
        };
        return res.json(new response(obj, responseMessage.TWOFA_ENABLED));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verifyTwoFactorGoogle:
   *   post:
   *     tags:
   *       - USER
   *     description: verifyTwoFactorGoogle
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: otp
   *         description: token
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Login success.
   *       401:
   *         description: Unauthorized token.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal server error.
   *       501:
   *         description: Something went wrong.
   */
  async verifyTwoFactorGoogle(req, res, next) {
    const validationSchema = {
      otp: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const verified = await speakeasy.totp.verify({
        secret: userResult.secretGoogle,
        encoding: "base32",
        token: Number(validatedBody.otp),
      });
      if (!verified) {
        throw apiError.notFound(responseMessage.INVALID_TOTP);
      }

      let data = await updateUser(
        {
          _id: userResult._id,
        },
        {
          $set: {
            google2FA: !userResult.google2FA,
            email2FA: false,
          },
        }
      );

      data = _.omit(JSON.parse(JSON.stringify(data)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(data, responseMessage.VERIFICATION_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/socialLogin:
   *   post:
   *     tags:
   *       - SOCIAL LOGIN
   *     description: socialLogin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: socialId
   *         description: socialId
   *         in: query
   *         required: true
   *       - name: socialType
   *         description: socialType
   *         in: query
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: query
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: query
   *         required: false
   *       - name: profilePic
   *         description: profilePic
   *         in: query
   *         type: file
   *         required: false
   *       - name: email
   *         description: email
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Login successfully.
   *       402:
   *         description: Incorrect login credential provided.
   *       404:
   *         description: User not found.
   */
  async socialLogin(req, res, next) {
    const validationSchema = {
      socialId: Joi.string().required(),
      socialType: Joi.string().required(),
      firstName: Joi.string().required(),
      email: Joi.string().optional(),
      lastName: Joi.string().optional(),
      profilePic: Joi.string().optional(),
      referralCode: Joi.string().optional(),
    };
    try {
      const adminSetting = (await adminSettings.findOne()) || {
        signupTicketBalance: 0,
        referralTicketBalance: 0,

      };

      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.query, validationSchema);

      const {
        socialId,
        socialType,
        firstName,
        email,
        lastName,
        profilePic,
        referralCode,
      } = validatedBody;
      const { files } = req;
      if (files) {
        if (files.length != 0) {
          profilePic = await commonFunction.getImageUrl(files);
        }
      }

      // let approved = await findBlockedUserName({
      //   "email.email": email,
      // });

      // if (!approved) {
      //   throw apiError.notFound(responseMessage.ADMIN_EMAIL_NOT_APPROVED);
      // }
      var userInfo = await findUser({
        email: email,
        status: {
          $ne: status.DELETE,
        },
      });

      let referrerResult = null;

      if (referralCode) {
        referrerResult = await findUserData({
          referralCode: referralCode,
          status: status.ACTIVE,
        });
        if (!referrerResult) {
          throw apiError.notFound(responseMessage.REFERRAL_CODE);
        }
      }

      if (!userInfo) {
        let unique = async (userName) => {
          let user = await findUser({
            userName: userName,
          });
          let blockedUsernames = await findBlockedUserName({
            "userName.userName": userName,
          });

          if (user || blockedUsernames) {
            userName = userName + "1";
            return await unique(userName);
          } else {
            return userName;
          }
        };

        let code =
          Math.floor(1000 + Math.random() * 900) + "" + (await userCount());
        let userName =
          validatedBody.firstName.slice(0, 3) +
          validatedBody.email.slice(0, 3) +
          code;
        userName = await unique(userName.toLowerCase());
        var data = {
          socialId: socialId,
          socialType: socialType,
          firstName: firstName,
          lastName: lastName,
          email: email,
          isSocial: true,
          otpVerified: true,
          profilePic: profilePic,
          referralCode: code,
          userName: userName,
          ticketBalance: adminSetting.signupTicketBalance,
        };

        if (referrerResult) {
          data.referrerId = referrerResult._id;
        }

        let result = await createUser(data);

        if (referrerResult) {
          await updateUser(
            { _id: referrerResult._id },
            { $inc: { ticketBalance: adminSetting.referralTicketBalance } }
          );
        }

        let token = await commonFunction.getToken({
          _id: result._id,
          email: result.email,
          userType: result.userType,
        });
        result = _.omit(JSON.parse(JSON.stringify(result)), [
          "otp",
          "password",
          "base64",
          "secretGoogle",
          "emailotp2FA",
          "withdrawOtp",
          "password",
        ]);

        return res.json(
          new response(
            {
              result,
              token,
            },
            responseMessage.LOGIN
          )
        );
      } else {
        if (userInfo.status == status.BLOCK) {
          throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
        }

        let token = await commonFunction.getToken({
          _id: userInfo._id,
          email: userInfo.email,
          userType: userInfo.userType,
        });

        userInfo = _.omit(JSON.parse(JSON.stringify(userInfo)), [
          "otp",
          "password",
          "base64",
          "secretGoogle",
          "emailotp2FA",
          "withdrawOtp",
          "password",
        ]);

        return res.json(
          new response(
            {
              userInfo,
              token,
            },
            responseMessage.LOGIN
          )
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  //*******************CONTACT US */

  /**
   * @swagger
   * /user/contactUs:
   *   post:
   *     tags:
   *       - CONTACT US
   *     description: contactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: message
   *         description: message
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Contact-Us data Saved successfully
   */

  async contactUs(req, res, next) {
    let validationSchema = {
      firstName: Joi.string().required(),
      email: Joi.string().required(),
      lastName: Joi.string().optional().allow(''),
      message: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      var adminResult = await findUser({
        userType: userType.ADMIN,
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.notFound("Admin not found");
      }
      var userResult = await findUser({
        email: validatedBody.email,
      });
      if (!userResult) {
        throw apiError.notFound("User not found");
      }

      var result = await createContactUs(validatedBody);
      await commonFunction.sendMailContactus(
        adminResult.email,
        adminResult.firstName,
        validatedBody.firstName,
        validatedBody.email,
        validatedBody.message
      );
      await commonFunction.sendMailContactusUser(
        validatedBody.email,
        validatedBody.firstName,
        validatedBody.message
      );

      return res.json(new response(result, responseMessage.CONTACT_US));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getContactUs:
   *   post:
   *     tags:
   *       - CONTACT US
   *     description: getContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: reply
   *         description: reply(true/false)boolean
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully.
   */

  async getContactUs(req, res, next) {
    const validationSchema = {
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      status: Joi.string().optional(),
      reply: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let adminRes = await getAllContactUs(validatedBody);
      return res.json(new response(adminRes, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/viewContactsUs:
   *   get:
   *     tags:
   *       - CONTACT US
   *     description: getContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: id
   *         description: id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   */

  async viewContactsUs(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let adminRes = await viewContactUs({
        _id: req.query.id,
      });
      return res.json(new response(adminRes, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getGameHistory:
   *   get:
   *     tags:
   *       - USER
   *     description: getGameHistory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: playedStatus
   *         description: playedStatus
   *         in: query
   *         required: false
   *       - name: gameId
   *         description: gameId
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getGameHistory(req, res, next) {
    const validationSchema = {
      playedStatus: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      gameId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      validatedBody.userId = userResult._id;
      let activity = await paginateGameHistory(validatedBody);
      if (activity.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(activity, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/createGameHistory:
   *   post:
   *     tags:
   *       - USER
   *     description: createGameHistory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: gameId
   *         description: gameId
   *         in: formData
   *         required: false
   *       - name: level
   *         description: level
   *         in: formData
   *         required: false
   *       - name: prize
   *         description: prize
   *         in: formData
   *         required: false
   *       - name: playedStatus
   *         description: playedStatus(WON,LOSE)
   *         in: formData
   *         required: false
   *       - name: timeSpent
   *         description: timeSpent
   *         in: formData
   *         required: false
   *       - name: highestScore
   *         description: highestScore
   *         in: formData
   *         required: false
   *       - name: gameCode
   *         description: gameCode
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async createGameHistory(req, res, next) {
    const validationSchema = Joi.object({
      gameCode: Joi.string().required(),
      gameId: Joi.string().required(),
      level: Joi.number().required(),
      prize: Joi.number().required(),
      playedStatus: Joi.string().required(),
      timeSpent: Joi.number().optional(),
      highestScore: Joi.number().required(),
      levelData: Joi.array()
        .items(
          Joi.object({
            _id: Joi.any().required(),
            level: Joi.number().required(),
            multiplier: Joi.any().required(),
            playerSpeed: Joi.any().optional(),
            gameSpeed: Joi.any().optional(),
            additionalParams: Joi.any().optional(),
          })
        )
        .optional(),
    });

    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      const userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.ADMIN },
        status: { $ne: status.DELETE },
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const game = await findGame({ _id: validatedBody.gameId });
      if (!game) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }


      if (game.gameTitle === "Flappy Bird") {
        console.log('Game Title is Flappy Bird');
        const totalPipes = game.level.reduce((sum, levelData) => {
          const levelNumber = Number(levelData.level); // assuming levels are '1', '2', '3', etc.

          if (levelNumber <= validatedBody.level) {
            const pipes = Number(levelData.additionalParams.get('pipes_per_level')) || 0;
            return sum + pipes;
          }

          return sum;
        }, 0);


        if (Number(validatedBody.highestScore) > totalPipes) {
          throw apiError.badRequest('Invalid Score.');
        }
      } else if (game.gameTitle === "Stack") {
        console.log('Game Title is Stack');
        const totalplatesperlevel = game.level.reduce((sum, levelData) => {
          const levelNumber = Number(levelData.level); // assuming levels are '1', '2', '3', etc.

          if (levelNumber <= validatedBody.level) {
            const plates = Number(levelData.additionalParams.get('plates_per_level')) || 0;
            return sum + plates;
          }

          return sum;
        }, 0);

        if (Number(validatedBody.highestScore) > (totalplatesperlevel)) {
          throw apiError.badRequest('Invalid Score.');
        }
      } else if (game.gameTitle === "doodle Jump") {

        const totalscore = game.level.reduce((sum, levelData) => {
          const levelNumber = Number(levelData.level); // assuming levels are '1', '2', '3', etc.

          if (levelNumber <= validatedBody.level) {
            const score = Number(levelData.additionalParams.get('score')) || 0;
            return sum + score;
          }

          return sum;
        }, 0);

        if (isNaN(Number(validatedBody.highestScore))) {
          throw apiError.badRequest('highestScore must be a number.');
        }

        if (Number(validatedBody.highestScore) > totalscore) {
          throw apiError.badRequest('Invalid Score.');
        }
      }
      const gameHistory = await findGameHistory({
        gameCode: validatedBody.gameCode,
        userId: userResult._id,
        gameId: game._id,
      });

      if (!gameHistory) {
        throw apiError.notFound(responseMessage.GAME_NOT_AVAILABLE);
      }
      if (gameHistory.gameStatus === 'COMPLETED') {
        throw apiError.notFound("your game has completed. Please start a new game.");
      }
      else {
        validatedBody.gameTitle = game.gameTitle;
        validatedBody.userId = userResult._id;

        let finalbalance = userResult.ticketBalance;

        const algorithm = "sha256";
        const secretKey = "asdpfcoapoewicaohaoeiuh";
        const levels = game.level;
        const levelData = validatedBody.levelData || [];

        for (let i = 0; i < levelData.length; i++) {
          const level = {
            multiplier: levels[i].multiplier,
            playerSpeed: levels[i].playerSpeed,
            gameSpeed: levels[i].gameSpeed,
            additionalParams: levels[i].additionalParams,
          };
          const levelDataObj = {
            multiplier: levelData[i].multiplier,
            playerSpeed: levelData[i].playerSpeed,
            gameSpeed: levelData[i].gameSpeed,
            additionalParams: levelData[i].additionalParams,
          };


          const providedLevelDataHash = crypto
            .createHmac(algorithm, secretKey)
            .update(JSON.stringify(levelDataObj))
            .digest("hex");


          const dbLevelDataHash = crypto
            .createHmac(algorithm, secretKey)
            .update(JSON.stringify(level))
            .digest("hex");

          if (providedLevelDataHash !== dbLevelDataHash) {
            validatedBody.playedStatus = winStatus.LOSE;
          }
        }
        if (validatedBody.playedStatus === winStatus.WON && gameHistory.prize === 0) {
          if (gameHistory.initialbalance > gameHistory.finalbalance) {
            const updatedUser = await updateUser(
              { _id: userResult._id },
              { $inc: { ticketBalance: validatedBody.prize } }, { new: true }
            );
            finalbalance = updatedUser.ticketBalance;
          }

        }
        const history = await updateGameHistoryById(
          { _id: gameHistory._id },
          {
            level: validatedBody.level,
            prize: (validatedBody.prize).toFixed(2),
            highestScore: validatedBody.highestScore,
            timeSpent: validatedBody.timeSpent,
            playedStatus: validatedBody.playedStatus,
            finalbalance: finalbalance,
            gameStatus: "COMPLETED",
          }
        );
        // if (validatedBody.playedStatus === winStatus.WON && parseFloat(gameHistory.finalbalance) < parseFloat(gameHistory.initialbalance)) {

        //   await updateUser(
        //     { _id: userResult._id },
        //     { $inc: { ticketBalance: validatedBody.prize } }
        //   );

        //   const updatedUser = await findUser({ _id: userResult._id });
        //   finalbalance = updatedUser.ticketBalance;

        //   var history = await updateGameHistoryById(
        //     { _id: gameHistory._id },
        //     {
        //       level: validatedBody.level,
        //       prize: validatedBody.prize,
        //       highestScore: validatedBody.highestScore,
        //       timeSpent: validatedBody.timeSpent,
        //       playedStatus: validatedBody.playedStatus,
        //       finalbalance: finalbalance,
        //     }
        //   );

        // }


        return res.json(
          new response(history, responseMessage.GAME_HISTORY_CREATED)
        );
      }
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/playGame:
   *   post:
   *     tags:
   *       - USER
   *     description: playGame
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: ticketAmount
   *         description: ticketAmount
   *         in: query
   *         required: true
   *       - name: gameId
   *         description: gameId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async playGame(req, res, next) {
    const validationSchema = {
      ticketAmount: Joi.string().required(),
      gameId: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let activeGame = await gameHistoryServices.checkActiveGame(req.userId);


      if (activeGame) {
        throw apiError.badRequest('You are already playing a game on another device.');
      }

      
      let game = await findGame({ _id: validatedBody.gameId });
      if (!game) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      if (validatedBody.ticketAmount < game.min || validatedBody.ticketAmount > game.max) {
        throw apiError.badRequest("Invalid bet amount, it should be within the limit");
      }

      if (isNaN(Number(userResult.ticketBalance)) || isNaN(Number(validatedBody.ticketAmount))) {
        throw apiError.badRequest("Invalid ticket amount or balance");
      }

      if (Number(validatedBody.ticketAmount) < 0) {
        throw apiError.badRequest("Ticket amount must be a positive number");
      }

      if (Number(userResult.ticketBalance) < Number(validatedBody.ticketAmount)) {
        throw apiError.conflict("Insufficient Balance");
      }

      let updatedAmount = await updateUser(
        { _id: userResult._id },
        { $inc: { ticketBalance: -validatedBody.ticketAmount } }
      );


      let finalbalance = userResult.ticketBalance - validatedBody.ticketAmount;


      let code = Math.floor(100000 + Math.random() * 900000) + "" + (await gameHistoryCount());

      let historyObj = {
        gameCode: code,
        userId: userResult._id,
        gameId: game._id,
        gameTitle: game.gameTitle,
        betAmount: validatedBody.ticketAmount,
        playedStatus: "LOSE",
        initialbalance: userResult.ticketBalance,
        finalbalance: finalbalance,  // Store the final balance after the game
        time: Date.now(),  // Store the timestamp of the game
      };
      let history = await createGameHistory(historyObj);

      return res.json(new response(history, responseMessage.GAME_JOINED_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  async getGamesByStatus(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      gameCode: Joi.string().optional(),
    };

    try {

      let validatedBody = await Joi.validate(req.query, validationSchema);
      let { userId, gameCode } = validatedBody;
      let games;
      if (gameCode) {
        games = await findAllGameHistory({
          userId: userId,
          gameCode: gameCode,
          gameStatus: { $in: ["PLAYING", "COMPLETED"] },
        });
      } else {
        games = await findAllGameHistory({
          userId: userId,
          gameStatus: { $in: ["PLAYING", "COMPLETED"] },
        });
      }

      if (games.length === 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      let lastPreviousGame;
      if (gameCode) {

        lastPreviousGame = games[0];
      } else {

        lastPreviousGame = games[0];
      }
      return res.json(new response({
        lastPreviousGame: lastPreviousGame
      }, responseMessage.DATA_FOUND));

    } catch (error) {
      return next(error);
    }
  }




  /**
   * @swagger
   * /user/getLeaderBoard:
   *   get:
   *     tags:
   *       - USER
   *     description: getLeaderBoard
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: gameId
   *         description: gameId
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getLeaderBoard(req, res, next) {
    const validationSchema = {
      gameId: Joi.string().optional(),
      search: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let { gameId } = validatedBody;
      if (gameId) {
        let game = await findGame({
          _id: gameId,
        });
        if (!game) {
          throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
        }
      }

      let leaderBoard = await aggregateLeaderBoard(validatedBody);
      if (leaderBoard.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(leaderBoard, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/userReferredList:
   *   get:
   *     tags:
   *       - USER
   *     description: userReferredList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: userType1
   *         description: userType1
   *         in: query
   *         required: false
   *       - name: status1
   *         description: status1
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Users found successfully.
   *       404:
   *         description: Users not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async userReferredList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      userType1: Joi.string().optional(),
      status1: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.referrerId = userResult._id;
      validatedBody.status1 = status.ACTIVE;
      validatedBody.otpVerified = true;
      let referredResult = await paginateSearch(validatedBody);
      if (referredResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(
        new response(referredResult, responseMessage.USERS_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getLatestBet:
   *   get:
   *     tags:
   *       - USER
   *     description: getGameHistory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: playedStatus
   *         description: playedStatus
   *         in: query
   *         required: false
   *       - name: gameId
   *         description: gameId
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getLatestBet(req, res, next) {
    const validationSchema = {
      playedStatus: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      gameId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      validatedBody.playedStatus = "WON";
      let activity = await paginateGameHistory(validatedBody);
      if (activity.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(activity, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/graphGameScore:
   *   get:
   *     tags:
   *       - USER
   *     description: getGameHistory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: playedStatus
   *         description: playedStatus
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphGameScore(req, res, next) {
    const validationSchema = {
      playedStatus: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      gameId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      validatedBody.userId = userResult._id;
      let activity = await paginateGameScore(validatedBody);
      if (activity.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(activity, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/editSound:
   *   put:
   *     tags:
   *       - USER
   *     description: editProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: gameSound
   *         description: gameSound
   *         in: formData
   *         required: false
   *       - name: gameMusic
   *         description: gameMusic
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editSound(req, res, next) {
    const validationSchema = {
      gameSound: Joi.boolean().optional(),
      gameMusic: Joi.boolean().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      var result = await updateUser(
        {
          _id: userResult._id,
        },
        validatedBody
      );
      result = _.omit(JSON.parse(JSON.stringify(result)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(result, responseMessage.GAME_SOUND_CHANGED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/viewUser:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: get particular user data
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: User found successfully.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async viewUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let userInfo = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      userResult = _.omit(JSON.parse(JSON.stringify(userInfo)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(userInfo, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }
}
export default new userController();
