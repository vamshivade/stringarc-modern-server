import Joi from "joi";
import mongoose from "mongoose";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
const { v4: uuidv4 } = require("uuid");
import { adminActivityServices } from "../../services/adminActivity";
const {
  createAdminActivity,
  paginateSearchActivityAdmin,
} = adminActivityServices;
import { userServices } from "../../services/user";
import { gameServices } from "../../services/game";
import { blockedUserServices } from "../../services/blockedUserName";
const {
  blockUserName,
  findBlockedUserNameData,
  updateBlockedUserNameById,
  updateBlockedUserName,
  paginateBlockedUserNameSearch,
  findBlockedUserName,
  findUserNames,
  deleteBlockedUserName,
} = blockedUserServices;
const {
  createGame,
  gameCheck,
  findGame,
  updateGame,
  paginateGame,
  updateGameById,
  gameCount,
} = gameServices;
const {
  userCheck,
  checkUserExists,
  emailExist,
  userCount,
  userCountGraph,
  createUser,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateAll,
  updateUserById,
  paginateSearch,
  multiUpdateLockedBal,
} = userServices;
import { transactionServices } from "../../services/transaction";
const {
  graphTransactionAggrigate,
  transactionCount,
  findTransactions,
  mostWithdraw,
  transactionPaginateSearch
} = transactionServices;

import { ticketServices } from "../../services/ticket";
const { ticketCount } = ticketServices;
import { contactUsServices } from "../../services/contactUs";
const {
  contactUsCount,
  findContactUs,
  updateContactUs,
  deleteAllContactUs,
} = contactUsServices;
import { gameHistoryServices } from "../../services/gameHistory";
const {
  gameHistoryCount,
  findAllGameHistory,
  paginateGameScore,
  paginateGameHistory,
  mostWon,
} = gameHistoryServices;
import { userActivityServices } from "../../services/userActivity";
const {
  createUserActivity,
  userActivityCount,
  paginateSearchActivity,
} = userActivityServices;
import defStatus from "../../../../enums/requestStatus";
import commonFunction from "../../../../helper/util";
import adminSettings from "../../../../models/adminSettings";
import { adsRewardServices } from "../../services/adsreward";
const { AdsRewards, paginateAdsrewardHistory } = adsRewardServices;
import { usertaskServices } from "../../services/usertasks";
const { findUserTask, paginateuserTask } = usertaskServices;
import { BoosterTransactionServices } from "../../services/boosterTransaction";
const { findBoosterTransactionAll, paginateBoosterTransaction } = BoosterTransactionServices;
import { ReferralHistoryServices } from "../../services/refferalHistory";
const { findReferralHistoryAll, paginateReferralHistory } = ReferralHistoryServices;
import { DailyClaimServices } from "../../services/dailyclaim";
import { log } from "node:console";
const { findDailyClaim, paginateDailyRewardHistory } = DailyClaimServices;


mongoose.set("useFindAndModify", false);

export class adminController {
  /**
   * @swagger
   * /admin/login:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: Admin login with email and Password
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
    var validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var results;
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, password } = validatedBody;
      var userResult = await findUser({
        $and: [
          {
            status: {
              $ne: status.DELETE,
            },
          },
          {
            userType: {
              $ne: userType.USER,
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
      }
      if (!bcrypt.compareSync(password, userResult.password)) {
        throw apiError.conflict(responseMessage.INCORRECT_LOGIN);
      } else {
        var token = await commonFunction.getToken({
          _id: userResult._id,
          email: userResult.email,
          mobileNumber: userResult.mobileNumber,
          userType: userResult.userType,
        });
        results = {
          _id: userResult._id,
          email: email,
          speakeasy: userResult.speakeasy,
          userType: userResult.userType,
          token: token,
        };
      }
      return res.json(new response(results, responseMessage.LOGIN));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/getProfile:
   *   get:
   *     tags:
   *       - ADMIN
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
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      adminResult = _.omit(JSON.parse(JSON.stringify(adminResult)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
        "private_key"
      ]);

      return res.json(new response(adminResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editProfile:
   *   put:
   *     tags:
   *       - ADMIN
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
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: true
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: true
   *       - name: bio
   *         description: bio
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfile(req, res, next) {
    const validationSchema = {
      email: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
      bio: Joi.string().allow("").optional(),
      profilePic: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userExist = await emailExist(validatedBody.email, userResult._id);
      if (userExist) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }

      var result = await updateUser(
        {
          _id: userResult._id,
        },
        validatedBody
      );
      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/forgotPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: forgotPassword by ADMIN on plateform when he forgot password
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
            userType: {
              $ne: userType.USER,
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
        var otp = commonFunction.getOTP();
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
   * /admin/verifyOTP:
   *   patch:
   *     tags:
   *       - ADMIN
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
   *         description: OTP send successfully.
   *       404:
   *         description: This user does not exist.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async verifyOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, otp } = validatedBody;
      let userResult = await findUser({
        email: email,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
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
   * /admin/resendOtp:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: resend otp by ADMIN on plateform when he resend otp
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
   *         description: Returns success message
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
            userType: {
              $ne: userType.USER,
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
        var otp = commonFunction.getOTP();
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
   * /admin/changePassword:
   *   patch:
   *     tags:
   *       - ADMIN
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
        userType: {
          $ne: userType.USER,
        },
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

      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/resetPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: false
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: false
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
      const { email, password, confirmPassword } = await Joi.validate(
        req.body,
        validationSchema
      );
      var userResult = await findUser({
        email: email,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
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
   * /admin/userList:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: get his own profile details with userList API
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
  async userList(req, res, next) {
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
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      // validatedBody.userType1 = userType.USER
      let userResult = await paginateSearch(validatedBody);
      if (userResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(userResult, responseMessage.USERS_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/userReferredList:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
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
   *       - name: referrerId
   *         description: referrerId
   *         in: query
   *         required: true
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
      referrerId: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.otpVerified = true;
      validatedBody.status1 = status.ACTIVE;
      let userResult = await paginateSearch(validatedBody);
      if (userResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(userResult, responseMessage.USERS_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/viewUser:
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
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let userResult = await findUser({
        _id: validatedBody.userId,
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
      userResult = _.omit(JSON.parse(JSON.stringify(userResult)), [
        "otp",
        "password",
        "base64",
        "secretGoogle",
        "emailotp2FA",
        "withdrawOtp",
        "password",
      ]);

      return res.json(new response(userResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  async updateBalance(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      balance: Joi.number().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let userResult = await findUser({
        _id: validatedBody.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let update = await updateUserById(
        {
          _id: userResult._id,
        },
        {
          ticketBalance: validatedBody.balance,
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

      return res.json(new response(update, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/activeBlockUser:
   *   put:
   *     tags:
   *       - USER MANAGEMENT
   *     description: activeBlockUser
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
   *       - name: reason
   *         description: reason
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async activeBlockUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
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
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser(
          {
            _id: userInfo._id,
          },
          {
            status: status.BLOCK,
          }
        );

        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "BLOCK USER",
        };
        await createAdminActivity(activityObj);
        return res.json(
          new response(blockRes, responseMessage.BLOCK_USER_BY_ADMIN)
        );
      } else {
        let activeRes = await updateUser(
          {
            _id: userInfo._id,
          },
          {
            status: status.ACTIVE,
          },
          { useFindAndModify: false }
        );

        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "UNBLOCK USER",
        };
        await createAdminActivity(activityObj);
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_USER_BY_ADMIN)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/activeAllUser:
   *   put:
   *     tags:
   *       - USER MANAGEMENT
   *     description: activeAllUser
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
  async activeAllUser(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let activeRes = await updateAll(
        {},
        {
          $set: {
            status: status.ACTIVE,
          },
        }
      );

      return res.json(
        new response(activeRes, responseMessage.UNBLOCK_USER_BY_ADMIN)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/activeSelectedUser:
   *   put:
   *     tags:
   *       - USER MANAGEMENT
   *     description: activeSelectedUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: selectedId
   *         description: selectedId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async activeSelectedUser(req, res, next) {
    const validationSchema = {
      selectedId: Joi.array().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let activeRes = await updateAll(
        {
          _id: {
            $in: validatedBody.selectedId,
          },
        },
        {
          $set: {
            status: status.ACTIVE,
          },
        }
      );

      return res.json(
        new response(activeRes, responseMessage.UNBLOCK_USER_BY_ADMIN)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteUser:
   *   delete:
   *     tags:
   *       - USER MANAGEMENT
   *     description: deleteUser
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
   *       - name: reason
   *         description: reason
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
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
      let activeRes = await updateUser(
        {
          _id: userInfo._id,
        },
        {
          status: status.DELETE,
        }
      );
      validatedBody.reason = "Violation of Company Terms and Conditions";
      let activityObj = {
        userId: userInfo._id,
        adminId: userResult._id,
        type: "DELETE USER",
      };
      await createAdminActivity(activityObj);
      let sendMail = await commonFunction.sendMailForDelete(
        activeRes.email,
        activeRes.firstName
      );
      return res.json(
        new response(activeRes, responseMessage.DELETE_USER_BY_ADMIN)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editUserProfile:
   *   put:
   *     tags:
   *       - USER
   *     description: editUserProfile
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
   *       - name: userId
   *         description: userId
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
   *       - name: email2FA
   *         description: email2FA
   *         in: formData
   *         required: false
   *       - name: google2FA
   *         description: google2FA
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editUserProfile(req, res, next) {
    const validationSchema = {
      google2FA: Joi.boolean().optional(),
      email2FA: Joi.boolean().optional(),
      email: Joi.string().optional(),
      userId: Joi.string().optional(),
      firstName: Joi.string().optional(),
      wallet: Joi.string().allow("").optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
      bio: Joi.string().allow("").optional(),
      profilePic: Joi.string().allow("").optional(),
      bannerPic: Joi.string().allow("").optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);

      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let user = await findUser({
        _id: validatedBody.userId,
      });
      if (!user) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }
      if (validatedBody.bannerPic) {
        validatedBody.bannerPic = await commonFunction.getSecureUrl(
          validatedBody.bannerPic
        );
      }
      if (validatedBody.wallet != user.wallet) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "WALLET UPDATE",
        };
        await createAdminActivity(activityObj);
      }
      if (validatedBody.email2FA != user.email2FA) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "email2FA UPDATE",
        };
        await createAdminActivity(activityObj);
      }
      if (validatedBody.google2FA != user.google2FA) {
        let activityObj = {
          userId: user._id,
          adminId: adminResult._id,
          type: "google2FA UPDATE",
        };
        await createAdminActivity(activityObj);
      }
      var result = await updateUserById(
        {
          _id: user._id,
        },
        validatedBody
      );
      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/dashBoard:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: activeBlockUser
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
  async dashBoard(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      // let userCounts = await userCount({});

      let [
        transactionCounts,
        totalDeposit,
        totalWithdrawl,
        totalGames,
        ticket,
        contactUs,
        pendingContactUs,
        userCounts,
      ] = await Promise.all([
        transactionCount({}),
        transactionCount({
          transactionType: "BUY",
          status: "APPROVE",
        }),
        transactionCount({
          transactionType: "WITHDRAW",
          status: "APPROVE",
        }),
        gameCount({
          status: {
            $ne: status.DELETE,
          },
        }),
        // announcementCount({}),
        ticketCount({}),
        contactUsCount({}),
        contactUsCount({
          reply: false,
        }),
        userCount({}),
      ]);

      let dashBoard = {
        totalUsers: userCounts,
        transactionCounts: transactionCounts,
        totalDeposit: totalDeposit,
        totalWithdrawl: totalWithdrawl,
        totalGames: totalGames,
        ticket: ticket,
        contactUs: contactUs,
        pendingContactUs: pendingContactUs,
      };


      return res.json(new response(dashBoard, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/graphDW:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: graphData
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: data
   *         description: data (MONTH/DAYS/YEARS)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphDW(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);

      var currentDay = new Date();
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

  //***********************SUBADMIN */

  /**
   * @swagger
   * /admin/addSubAdmin:
   *   post:
   *     tags:
   *       - SUBADMIN
   *     summary: add Subadmin
   *     description: addSubAdmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: permissions
   *         description: Permissions
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: SubAdmin created successfully
   */
  async addSubAdmin(req, res, next) {
    let validationSchema = {
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().optional(),
      permissions: Joi.array().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });

      if (!adminResult)
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      let userResult = await findUser({
        email: validatedBody.email,
        status: {
          $ne: status.DELETE,
        },
      });
      if (userResult) {
        throw apiError.conflict(responseMessage.USER_ALREADY_EXIST);
      }
      let pass = await commonFunction.generateTempPassword();
      validatedBody.userType = userType.SUBADMIN;
      validatedBody.password = bcrypt.hashSync(pass);
      validatedBody.otpVerified = true;

      var result = await createUser(validatedBody);
      let sendMail = await commonFunction.sendMailForSubAdmin(
        result.email,
        result.firstName,
        pass,
        adminResult.email
      );
      let obj = {
        userId: result._id,
        email: result.email,
        userType: result.userType,
        status: result.status,
        permission: result.permissions,
      };
      let activityObj = {
        userId: result._id,
        adminId: adminResult._id,
        type: "ADD SUB_ADMIN",
      };
      await createAdminActivity(activityObj);
      return res.json(new response(obj, responseMessage.SUBADMIN_ADDED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/listSubAdmin:
   *   get:
   *     tags:
   *       - SUBADMIN
   *     description: listSubAdmin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status i.e ACTIVE || BLOCK
   *         in: query
   *       - name: search
   *         description: search i.e by WalletAddress || email || mobileNumber || userName
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
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listSubAdmin(req, res, next) {
    const validationSchema = {
      status: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (userResult.length == 0) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.userType1 = userType.SUBADMIN;
      let dataResults = await paginateSearch(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/blockUnblockSubAdmin:
   *   put:
   *     tags:
   *       - SUBADMIN
   *     description: blockUnblockSubAdmin
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
   *       - name: reason
   *         description: reason
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async blockUnblockSubAdmin(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.US);
      }
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser(
          {
            _id: userInfo._id,
          },
          {
            status: status.BLOCK,
          }
        );
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "BLOCK SUB_ADMIN",
        };
        await createAdminActivity(activityObj);
        let sendMail = await commonFunction.sendMailForBlock(
          blockRes.email,
          blockRes.firstName
        );
        return res.json(new response(blockRes, responseMessage.BLOCK_BY_ADMIN));
      } else {
        let activeRes = await updateUser(
          {
            _id: userInfo._id,
          },
          {
            status: status.ACTIVE,
          }
        );
        let activityObj = {
          userId: userInfo._id,
          adminId: userResult._id,
          type: "UNBLOCK SUB_ADMIN",
        };
        await createAdminActivity(activityObj);
        let sendMail = await commonFunction.sendMailForUnblock(
          activeRes.email,
          activeRes.firstName
        );
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_BY_ADMIN)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteSubAdmin:
   *   delete:
   *     tags:
   *       - SUBADMIN
   *     description: deleteSubAdmin
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
   *       - name: reason
   *         description: reason
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteSubAdmin(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
      reason: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var userInfo = await findUser({
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
      let activeRes = await updateUser(
        {
          _id: userInfo._id,
        },
        {
          status: status.DELETE,
        }
      );
      validatedBody.reason = "Violation of Company Terms and Conditions";
      let sendMail = await commonFunction.sendMailForDelete(
        activeRes.email,
        activeRes.firstName
      );
      let activityObj = {
        userId: userInfo._id,
        adminId: userResult._id,
        type: "DELETE SUB_ADMIN",
      };
      await createAdminActivity(activityObj);
      return res.json(
        new response(activeRes, responseMessage.DELETE_USER_BY_ADMIN)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/editProfileSubAdmin:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: editProfileSubAdmin
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
   *       - name: id
   *         description: id
   *         in: formData
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: true
   *       - name: permissions
   *         description: Permissions
   *         in: formData
   *         required: true
   *         type: array
   *         items:
   *           type: string
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfileSubAdmin(req, res, next) {
    const validationSchema = {
      email: Joi.string().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      profilePic: Joi.string().optional(),
      id: Joi.string().required(),
      permissions: Joi.array().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userResult = await findUser({
        _id: validatedBody.id,
        userType: userType.SUBADMIN,
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userExist = await emailExist(validatedBody.email, userResult._id);

      if (userExist) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic) {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }

      var result = await updateUser(
        {
          _id: userResult._id,
        },
        validatedBody
      );
      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/replyContactUs:
   *   put:
   *     tags:
   *       - USER MANAGEMENT
   *     description: replyContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *       - name: message
   *         description: message
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async replyContactUs(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      message: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let contactResult = await findContactUs({
        _id: validatedBody._id,
        reply: false,
      });
      if (!contactResult) {
        throw apiError.unauthorized(responseMessage.CONTACT_US_NOT_FOUND);
      }
      let user = await findUser({
        email: contactResult.email,
      });
      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let contactRes = await updateContactUs(
        {
          _id: contactResult._id,
        },
        {
          reply: true,
          replyMsg: validatedBody.message,
        }
      );

      let activityObj = {
        userId: user._id,
        adminId: adminResult._id,
        type: "REPLY QUERY",
      };
      await createAdminActivity(activityObj);
      let sendMail = await commonFunction.sendMailReplyFromAdmin(
        contactRes.email,
        contactRes.firstName,
        validatedBody.message,
        contactResult.message
      );

      return res.json(new response(contactRes, responseMessage.REPLY_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/graphForUser:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: graphForUser
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
   *       - name: data
   *         description: data (MONTH/DAYS/YEARS)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphForUser(req, res, next) {
    try {
      const admin = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!admin) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      const user = await findUser({
        _id: req.query.userId,
        userType: userType.USER,
      });
      if (!user) throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      var currentDay = new Date();
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
   * /admin/getUserActivity:
   *   get:
   *     tags:
   *       - USER_MANAGEMENT
   *     description: get his own profile details with getProfile API
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
  async getUserActivity(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      type: Joi.string().optional(),
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

      let activity = await paginateSearchActivity(validatedBody);

      if (activity.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(activity, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/getAdminActivity:
   *   get:
   *     tags:
   *       - USER_MANAGEMENT
   *     description: getAdminActivity
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
   *       - name: adminId
   *         description: adminId
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getAdminActivity(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      adminId: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      type: Joi.string().optional(),
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

      let activity = await paginateSearchActivityAdmin(validatedBody);

      if (activity.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(activity, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/getUserGameHistory:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: getUserGameHistory
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
   *       - name: playedStatus
   *         description: playedStatus
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getUserGameHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      type: Joi.string().optional(),
      playedStatus: Joi.string().optional(),
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

      let activity = await paginateGameHistory(validatedBody);

      if (activity.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(activity, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }
  //****************Block UserName Management */

  /**
   * @swagger
   * /admin/editBlockedUserName:
   *   put:
   *     tags:
   *       - USERNAME_MANAGEMENT
   *     description: editUserNameBlocked
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userName
   *         description: userName(array)
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email(array)
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async editBlockedUserName(req, res, next) {
    const validationSchema = {
      userName: Joi.array().optional(),
      email: Joi.array().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      var userNameInfo = await findBlockedUserName();

      if (!userNameInfo) {
        throw apiError.notFound(responseMessage.USERName_NOT_FOUND);
      }

      if (validatedBody.userName) {
        let users = await userFindList({
          userName: {
            $in: validatedBody.userName,
          },
        });

        var blockedUserNamesObject = {
          userName: validatedBody.userName.map((userName) => ({
            _id: uuidv4(),
            userName,
            created: new Date(),
          })),
        };
        userNameInfo.userName.push(...blockedUserNamesObject.userName);
      }
      if (validatedBody.email) {
        var blockedUserNamesObject = {
          email: validatedBody.email.map((email) => ({
            _id: uuidv4(),
            email,
            created: new Date(),
          })),
        };
        userNameInfo.email.push(...blockedUserNamesObject.email);
      }

      var updated = await updateBlockedUserNameById(
        {
          _id: userNameInfo._id,
        },
        userNameInfo
      );

      return res.json(new response(updated, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/listBlockedUserName:
   *   get:
   *     tags:
   *       - USERNAME_MANAGEMENT
   *     description: listBlockedUserName
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
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listBlockedUserName(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let dataResults = await findBlockedUserName();
      dataResults.userName.reverse();
      if (req.query.search) {
        const regex = new RegExp(req.query.search, "i");
        dataResults.userName = dataResults.userName.filter((user) =>
          regex.test(user.userName)
        );
      }

      if (req.query.toDate && req.query.fromDate) {
        dataResults.userName = dataResults.userName.filter(
          (user) =>
            user.created >=
            new Date(
              new Date(req.query.fromDate).toISOString().slice(0, 10)
            ) &&
            user.created <=
            new Date(
              new Date(req.query.toDate).toISOString().slice(0, 10) +
              "T23:59:59.999Z"
            )
        );
      }
      if (req.query.fromDate && !req.query.toDate) {
        dataResults.userName = dataResults.userName.filter(
          (user) =>
            user.created >=
            new Date(new Date(req.query.fromDate).toISOString().slice(0, 10))
        );
      }
      if (req.query.toDate && !req.query.fromDate) {
        dataResults.userName = dataResults.userName.filter(
          (user) =>
            user.created <=
            new Date(
              new Date(req.query.toDate).toISOString().slice(0, 10) +
              "T23:59:59.999Z"
            )
        );
      }

      const paginateGood = (array, page_size, page_number) => {
        const startIndex = (page_number - 1) * page_size;

        const endIndex = startIndex + page_size;

        return array.slice(startIndex, endIndex);
      };

      let page = req.query.page;
      let limit = req.query.limit;
      let properResult = {
        docs: paginateGood(dataResults.userName, Number(limit), Number(page)),
        total: dataResults.userName.length,
        limit: Number(limit),
        page: Number(page),
        pages: Math.ceil(dataResults.userName.length / limit),
      };
      if (properResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(properResult, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/approvedEmail:
   *   get:
   *     tags:
   *       - USERNAME_MANAGEMENT
   *     description: approvedEmail
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
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async approvedEmail(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let dataResults = await findBlockedUserName();
      dataResults.email.reverse();
      if (req.query.search) {
        const regex = new RegExp(req.query.search, "i");
        dataResults.email = dataResults.email.filter((user) =>
          regex.test(user.email)
        );
      }
      // if (req.query.search) {
      //   dataResults.email = dataResults.email.filter(user => user.email === req.query.search);

      // }
      if (req.query.toDate && req.query.fromDate) {
        dataResults.email = dataResults.email.filter(
          (user) =>
            user.created >=
            new Date(
              new Date(req.query.fromDate).toISOString().slice(0, 10)
            ) &&
            user.created <=
            new Date(
              new Date(req.query.toDate).toISOString().slice(0, 10) +
              "T23:59:59.999Z"
            )
        );
      }
      if (req.query.fromDate && !req.query.toDate) {
        dataResults.email = dataResults.email.filter(
          (user) =>
            user.created >=
            new Date(new Date(req.query.fromDate).toISOString().slice(0, 10))
        );
      }
      if (req.query.toDate && !req.query.fromDate) {
        dataResults.email = dataResults.email.filter(
          (user) =>
            user.created <=
            new Date(
              new Date(req.query.toDate).toISOString().slice(0, 10) +
              "T23:59:59.999Z"
            )
        );
      }
      const paginateGood = (array, page_size, page_number) => {
        const startIndex = (page_number - 1) * page_size;

        const endIndex = startIndex + page_size;

        return array.slice(startIndex, endIndex);
      };
      let page = req.query.page;
      let limit = req.query.limit;
      let properResult = {
        docs: paginateGood(dataResults.email, Number(limit), Number(page)),
        total: dataResults.email.length,
        limit: Number(limit),
        page: Number(page),
        pages: Math.ceil(dataResults.email.length / limit),
      };
      if (properResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(properResult, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/deleteBlockedUserName:
   *   delete:
   *     tags:
   *       - USERNAME_MANAGEMENT
   *     description: deleteBlockedUserName
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userNameId
   *         description: userNameId
   *         in: formData
   *         required: false
   *       - name: emailId
   *         description: emailId
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async deleteBlockedUserName(req, res, next) {
    const validationSchema = {
      userNameId: Joi.string().optional(),
      emailId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let updated;
      if (validatedBody.userNameId) {
        updated = await updateBlockedUserNameById(
          {
            status: status.ACTIVE,
          },
          {
            $pull: {
              userName: {
                _id: validatedBody.userNameId,
              },
            },
          }
        );
      }
      if (validatedBody.emailId) {
        updated = await updateBlockedUserNameById(
          {
            status: status.ACTIVE,
          },
          {
            $pull: {
              email: {
                _id: validatedBody.emailId,
              },
            },
          }
        );
      }
      return res.json(new response(updated, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteSelectedUserName:
   *   delete:
   *     tags:
   *       - USERNAME_MANAGEMENT
   *     description: deleteSelectedUserName
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userNameId
   *         description: userNameId
   *         in: formData
   *         required: false
   *       - name: emailId
   *         description: emailId
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async deleteSelectedUserName(req, res, next) {
    const validationSchema = {
      userNameId: Joi.array().optional(),
      emailId: Joi.array().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let updated;
      if (validatedBody.userNameId) {
        updated = await updateBlockedUserNameById(
          {
            status: status.ACTIVE,
          },
          {
            $pull: {
              userName: {
                _id: {
                  $in: validatedBody.userNameId,
                },
              },
            },
          }
        );
      }
      if (validatedBody.emailId) {
        updated = await updateBlockedUserNameById(
          {
            status: status.ACTIVE,
          },
          {
            $pull: {
              email: {
                _id: {
                  $in: validatedBody.emailId,
                },
              },
            },
          }
        );
      }
      return res.json(new response(updated, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/graphGameHistory:
   *   get:
   *     tags:
   *       - ADMIN
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
  async graphGameHistory(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
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
   * /admin/graphUserGameHistory:
   *   get:
   *     tags:
   *       - ADMIN
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
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphUserGameHistory(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
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
                  userId: req.query.userId,
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
                  userId: req.query.userId,
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
                  userId: req.query.userId,
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
                  userId: req.query.userId,
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
   * /admin/userRegistration:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: userRegistration
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
  async userRegistration(req, res, next) {
    try {
      const user = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
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

          let Users = await userCountGraph({
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
                userType: userType.USER,
              },
            ],
          });
          let objDb = {
            Users: Users,
            date: daysOfWeek[i],
          };
          weekDataRes.push(objDb);
        }
        return res.json(new response(weekDataRes, responseMessage.DATA_FOUND));
      } else {
        for (let i = 0; i < 12; i++) {
          let dataRes = new Date().setMonth(new Date().getMonth() - i);
          dataRes = new Date(dataRes);
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
          startTime = new Date(
            new Date(startTime).toISOString().slice(0, 10) + "T23:59:59.999Z"
          );
          lastTime = new Date(
            new Date(lastTime).toISOString().slice(0, 10) + "T23:59:59.999Z"
          );
          lastTime.setTime(lastTime.getTime() + 86400000);
          let Users = await userCountGraph({
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
                userType: userType.USER,
              },
            ],
          });
          let objDb = {
            Users: Users,
            date: daysOfWeek[i],
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
   * /admin/graphGameScoreAll:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: graphGameScoreAll
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
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async graphGameScoreAll(req, res, next) {
    const validationSchema = {
      playedStatus: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      gameId: Joi.string().optional(),
      userId: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

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
   * /admin/deletedb:
   *   delete:
   *     tags:
   *       - SUBADMIN
   *     description: deletedb
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
  async deletedb(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      await deleteAllContactUs();
      await deleteBlockedUserName();
      return res.json(
        new response(
          "Deleted Successfully",
          responseMessage.DELETE_USER_BY_ADMIN
        )
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/updateLockedAmount:
   *   delete:
   *     tags:
   *       - ADMIN
   *     description: updateLockedAmount
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
  async updateLockedAmount(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      await multiUpdateLockedBal();
      return res.json(
        new response("Update Successfully", responseMessage.UPDATE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/dashboardV1:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: dashboardV1
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
  async dashboardV1(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let [
        transactionCounts,
        totalDeposit,
        totalWithdrawl,
        totalGames,
        announcement,
        ticket,
        contactUs,
        pendingContactUs,
        userCounts,
        buy,
        withdraw,
      ] = await Promise.all([
        transactionCount({}),
        transactionCount({
          transactionType: "BUY",
          status: "APPROVE",
        }),
        transactionCount({
          transactionType: "WITHDRAW",
          status: "APPROVE",
        }),
        gameCount({
          status: {
            $ne: status.DELETE,
          },
        }),
        // announcementCount({}),
        ticketCount({}),
        contactUsCount({}),
        contactUsCount({
          reply: false,
        }),
        userCount({
          status: status.ACTIVE,
        }),
        findTransactions({
          transactionType: "BUY",
          status: "APPROVE",
        }),
        findTransactions({
          transactionType: "WITHDRAW",
          status: "APPROVE",
        }),
      ]);

      let buyAmount = 0;
      let withdrawAmount = 0;
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


      let dashBoard = {
        totalUsers: userCounts,
        transactionCounts: transactionCounts,
        totalDeposit: totalDeposit,
        totalWithdrawl: totalWithdrawl,
        totalGames: totalGames,
        announcement: announcement,
        ticket: ticket,
        contactUs: contactUs,
        pendingContactUs: pendingContactUs,
        depositAmount: buyAmount,
        withdrawAmount: withdrawAmount,
      };

      return res.json(new response(dashBoard, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/mostWonUser:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
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
  async mostWonUser(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      let userResult = await mostWon(validatedBody);
      if (userResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(userResult, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/mostWithdrawUser:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
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
   *       - name: status
   *         description: status
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
  async mostWithdrawUser(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      status: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      let userResult = await mostWithdraw(validatedBody);
      if (userResult.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      return res.json(new response(userResult, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/editAdminWallet:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: editAdminWallet
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: wallet
   *         description: wallet
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editAdminWallet(req, res, next) {
    const validationSchema = {
      wallet: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
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

      var result = await updateUser(
        {
          _id: userResult._id,
        },
        validatedBody
      );
      return res.json(new response(result, responseMessage.WALLET_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/settings:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: Get current admin settings
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns current admin settings
   */
  async getAdminSettings(req, res, next) {
    try {
      const settings = await adminSettings.findOne();
      if (!settings) {
        throw apiError.notFound(responseMessage.SETTINGS_NOT_FOUND);
      }
      return res.json(new response(settings, responseMessage.SETTINGS_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/settings:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: Update admin settings
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: Admin token
   *         in: header
   *         required: true
   *       - name: signupTicketBalance
   *         description: Signup ticket balance
   *         in: formData
   *         required: true
   *       - name: referralTicketBalance
   *         description: Referral ticket balance
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async updateAdminSettings(req, res, next) {


    const validationSchema = {
      signupTicketBalance: Joi.number().required(),
      referralTicketBalance: Joi.number().required(),
      Referral_Note: Joi.string().required(),
      Bot_Name: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let settings = await adminSettings.findOne();

      if (!settings) {
        settings = new adminSettings(validatedBody);
      } else {
        settings.signupTicketBalance = validatedBody.signupTicketBalance;
        settings.referralTicketBalance = validatedBody.referralTicketBalance;
        settings.Referral_Note = validatedBody.Referral_Note;
        settings.Bot_Name = validatedBody.Bot_Name;

      }

      await settings.save();
      return res.json(new response(settings, responseMessage.SETTINGS_UPDATED));
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /admin/userDashboard/{id}:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: "Fetches the user's dashboard data."
   *     parameters:
   *       - name: token
   *         in: header
   *         description: Admin token.
   *         required: true
   *         schema:
   *           type: string
   *       - name: id
   *         in: path
   *         description: userId
   *         required: true
   *         schema:
   *           type: string
   *           pattern: "^[a-fA-F0-9]{24}$"  # MongoDB ObjectId pattern
   *     responses:
   *       200:
   *         description: "User dashboard data found successfully"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalWithdrawlCounts:
   *                   type: integer
   *                   description: "The total number of withdrawal transactions."
   *                 totalWithdrawlAmount:
   *                   type: number
   *                   description: "The total amount withdrawn by the user."
   *                 totalUSDTWithdrawlAmount:
   *                   type: number
   *                   description: "The total amount withdrawn in USDT."
   *                 totalGames:
   *                   type: integer
   *                   description: "The total number of games played by the user."
   *                 totalinvestment:
   *                   type: number
   *                   description: "The total amount of investments made by the user."
   *                 totalwins:
   *                   type: integer
   *                   description: "The total number of games won by the user."
   *                 totalloss:
   *                   type: integer
   *                   description: "The total number of games lost by the user."
   *                 totaladswatched:
   *                   type: integer
   *                   description: "The total number of ads watched by the user."
   *                 totaladsReward:
   *                   type: number
   *                   description: "The total reward points earned from ads watched."
   *                 totalusertasks:
   *                   type: integer
   *                   description: "The total number of tasks completed by the user."
   *                 totaltaskReward:
   *                   type: number
   *                   description: "The total reward points earned from tasks completed."
   *                 totalboosters:
   *                   type: integer
   *                   description: "The total number of boosters used by the user."
   *                 boostersAmount:
   *                   type: number
   *                   description: "The total amount spent on boosters by the user."
   *       400:
   *         description: "Bad Request"
   *       401:
   *         description: "Unauthorized access"
   *       500:
   *         description: "Internal server error"
   */


  async userdashBoard(req, res, next) {
    try {

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER,
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      let [
        userBalance,
        totalWithdrawlCounts,
        totalWithdrawls,
        totalGames,
        totalinvest,
        totalwins,
        totalloss,
        totaladswatched,
        totaltaskscompleted,
        totalboosters,
        Totaldailyrewards,
        TotalReferrals

      ] = await Promise.all([
        findUser({ _id: req.query.id }),
        transactionCount({
          userId: req.query.id,
          transactionType: "WITHDRAW",
          status: "TRANSFERRED",
        }),
        findTransactions({
          userId: req.query.id,
          transactionType: "WITHDRAW",
          status: "TRANSFERRED",
        }),
        gameHistoryCount({
          userId: req.query.id,
        }),
        findAllGameHistory({
          userId: req.query.id,
        }),
        gameHistoryCount({
          userId: req.query.id,
          playedStatus: "WON"
        }),
        gameHistoryCount({
          userId: req.query.id,
          playedStatus: "LOSE"
        }),

        AdsRewards({ user_id: req.query.id }),
        findUserTask({ user_id: req.query.id }),
        findBoosterTransactionAll({ User_Id: req.query.id }),
        findDailyClaim({ userId: req.query.id }),
        findReferralHistoryAll({ ReferredBy: req.query.id })

      ]);


      const totalWithdraw = totalWithdrawls.reduce((sum, transaction) => {
        return sum + (transaction.quantity || 0); // Safeguard for missing amount
      }, 0);
      const totalWithdrawinusdt = totalWithdrawls.reduce((sum, transaction) => {
        return sum + (transaction.amount || 0); // Safeguard for missing amount
      }, 0);
      const totalinvestment = totalinvest.reduce((sum, invest) => {
        return sum + (invest.betAmount || 0); // Safeguard for missing amount
      }, 0);
      const totaladsReward = totaladswatched.reduce((sum, reward) => {
        return sum + (reward.Rewardpoints || 0); // Safeguard for missing amount
      }, 0);
      const totaltaskReward = totaltaskscompleted.reduce((sum, reward) => {
        return sum + (reward.Rewardpoints || 0); // Safeguard for missing amount
      }, 0);
      const totalboostervalue = totalboosters.reduce((sum, reward) => {
        return sum + (reward.Amount || 0); // Safeguard for missing amount
      }, 0);
      const totaldailybonus = Totaldailyrewards.reduce((sum, reward) => {
        return sum + (reward.Reward_Amount || 0); // Safeguard for missing amount
      }, 0);
      const totalreferralreward = TotalReferrals.reduce((sum, reward) => {
        return sum + (reward.Referral_Amount || 0); // Safeguard for missing amount
      }, 0);

      let dashBoard = {
        TotalUserBalance: userBalance.ticketBalance,
        totalWithdrawlCounts: totalWithdrawlCounts,
        totalWithdrawlAmount: totalWithdraw,
        totalUSDTWithdrawlAmount: totalWithdrawinusdt,
        totalGames: totalGames,
        totalinvestment: totalinvestment,
        totalwins: totalwins,
        totalloss: totalloss,
        totaladswatched: totaladswatched.length,
        totaladsReward: totaladsReward,
        totalusertasks: totaltaskscompleted.length,
        totaltaskReward: totaltaskReward,
        totalboosters: totalboosters.length,
        boostersAmount: totalboostervalue,
        totaldailybonus: totaldailybonus,
        Totaldailyrewards: Totaldailyrewards.length,
        totalreferralreward: totalreferralreward,
        TotalReferrals: TotalReferrals.length
      };

      return res.json(new response(dashBoard, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
  //  * @swagger
   * /game-history:
   *   get:
   *     summary: "Fetches game history with pagination and filters"
   *     description: "This endpoint allows fetching game history with optional filters like user ID, transaction type, status, search, and date range."
   *     parameters:
   *       - name: userId
   *         in: query
   *         description: "The ID of the user whose game history is to be fetched."
   *         required: false
   *         schema:
   *           type: string
   *       - name: search
   *         in: query
   *         description: "Search query to filter game history results."
   *         required: false
   *         schema:
   *           type: string
   *       - name: fromDate
   *         in: query
   *         description: "The start date for filtering game history."
   *         required: false
   *         schema:
   *           type: string
   *           format: date
   *       - name: toDate
   *         in: query
   *         description: "The end date for filtering game history."
   *         required: false
   *         schema:
   *           type: string
   *           format: date
   *       - name: page
   *         in: query
   *         description: "The page number for pagination."
   *         required: false
   *         schema:
   *           type: string
   *       - name: limit
   *         in: query
   *         description: "The number of results per page for pagination."
   *         required: false
   *         schema:
   *           type: string
   *       - name: transactionType
   *         in: query
   *         description: "The type of transaction (e.g., 'BET', 'WIN')."
   *         required: false
   *         schema:
   *           type: string
   *       - name: status
   *         in: query
   *         description: "The status of the game (e.g., 'COMPLETED', 'PENDING')."
   *         required: false
   *         schema:
   *           type: string
   *       - name: notEqual
   *         in: query
   *         description: "Filter where a field is not equal to a value."
   *         required: false
   *         schema:
   *           type: string
   *       - name: userName
   *         in: query
   *         description: "Filter results by username."
   *         required: false
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: "Game history data found successfully"
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 gameHistory:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       gameId:
   *                         type: string
   *                         description: "The ID of the game."
   *                       transactionType:
   *                         type: string
   *                         description: "The type of transaction related to the game."
   *                       status:
   *                         type: string
   *                         description: "The status of the game."
   *                       amount:
   *                         type: number
   *                         description: "The amount involved in the game."
   *       400:
   *         description: "Bad Request"
   *       401:
   *         description: "Unauthorized access"
   *       500:
   *         description: "Internal server error"
   */


  async GameHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      status: Joi.string().optional(),
      gameId: Joi.string().optional(),
      gameTitle: Joi.string().optional(),
      userName: Joi.string().optional()
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let gameHistory = await paginateGameHistory(validatedBody);
      return res.json(
        new response(gameHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  async AdsHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let gameHistory = await paginateAdsrewardHistory(validatedBody);
      return res.json(
        new response(gameHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  async TaskHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let gameHistory = await paginateAdsrewardHistory(validatedBody);
      return res.json(
        new response(gameHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  async dailyRewardHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let gameHistory = await paginateAdsrewardHistory(validatedBody);
      return res.json(
        new response(gameHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  async ReferralHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let gameHistory = await paginateAdsrewardHistory(validatedBody);
      return res.json(
        new response(gameHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  async getReferralHistories(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    console.log(req.body, " req.body");

    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      console.log(validatedBody, " validatedBody");

      if (validatedBody.userId) {
        if (!(req.headers && req.headers.key === process.env.key)) {
          throw apiError.unauthorized(responseMessage.FORBIDDEN);
        }
        const user = await findUser({
          chatId: validatedBody.userId,
          status: "ACTIVE"
        })
        if (!user) {
          throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }
        const referralCount = await ReferralHistoryServices.findReferralCountByUserId(validatedBody.userId);
        return res.json(new response({ referralCount, currentDate: new Date(Date.now()), }, responseMessage.DATA_FOUND));
      }

    } catch (error) {
      return next(error);
    }
  }



  async AlluserHistories(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      status: Joi.string().optional(),
      gameId: Joi.string().optional(),
      gameTitle: Joi.string().optional(),
      userName: Joi.string().optional(),
      ReferredBy: Joi.string().optional(),
      historyType: Joi.string().optional(), // 'booster', 'ads', 'task', etc.
    };


    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);

      // Validate admin privileges
      const userResult = await findUser({
        _id: req.userId,

        status: status.ACTIVE
      });

      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      // Based on the history type, paginate the appropriate data
      let historyData;

      switch (validatedBody.historyType) {

        case 'game':
          historyData = await paginateGameHistory(validatedBody); // Call the booster data pagination function
          break;
        case 'booster':
          historyData = await paginateBoosterTransaction(validatedBody); // Call the booster data pagination function
          break;
        case 'ads':
          historyData = await paginateAdsrewardHistory(validatedBody); // Call the ads data pagination function
          break;
        case 'task':
          historyData = await paginateuserTask(validatedBody); // Call the task data pagination function
          break;
        case 'dailyReward':
          historyData = await paginateDailyRewardHistory(validatedBody); // Call the daily reward pagination function
          break;
        case 'referral':
          historyData = await paginateReferralHistory(validatedBody);
          break;
        case 'withdrawals':
          historyData = await transactionPaginateSearch(validatedBody);
          break;
        default:

          historyData = await paginateGameHistory(validatedBody); // Call a combined pagination function
      }

      return res.json(
        new response(historyData, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }



}
export default new adminController();
