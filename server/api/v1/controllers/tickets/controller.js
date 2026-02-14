import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import ticketStatus from "../../../../enums/requestStatus";
import responseMessage from "../../../../../assets/responseMessage";
const { Address } = require('@ton/core');
import status, {
  ACTIVE
} from "../../../../enums/status";
import userType from "../../../../enums/userType";
const speakeasy = require('speakeasy');
import {
  ticketServices
} from "../../services/ticket";
import commonFunction from "../../../../helper/util";
import { adminActivityServices } from "../../services/adminActivity";
const { createAdminActivity, paginateSearchActivityAdmin } = adminActivityServices
const {
  findTicket,
  updateTicket,
  paginateTicket,
  ticketList,
  createTicket
} =
  ticketServices;
import {
  userServices
} from "../../services/user";
import { WithdrawSettingServices } from "../../services/withdrawsettings"

const {
  findUser,
  findUserData,
  updateUser
} = userServices;

import {
  gameServices
} from "../../services/game";

const {
  findGame
} = gameServices;
import {
  transactionServices
} from "../../services/transaction";

const {
  createTransaction,
  updateTransaction,
  findTransactions,
  getTransaction,
  transactionPaginateSearch,
} = transactionServices;
const fs = require('fs')

const axios = require('axios')
const { Cell } = require("@ton/core");
const { PublicKey } = require('@solana/web3.js');
export class ticketController {
  /**
   * @swagger
   * /ticket/createTicket:
   *   post:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: createTicket
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: gameName
   *         description: gameName
   *         in: formData
   *         required: true
   *       - name: ticketQuantity
   *         description: ticketQuantity
   *         in: formData
   *         required: true
   *       - name: amountInToken
   *         description: amountInToken
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async createTicket(req, res, next) {
    const validationSchema = {
      gameName: Joi.string().required(),
      ticketQuantity: Joi.number().optional(),
      amountInToken: Joi.number().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      let game = await findGame({
        gameTitle: validatedBody.gameName
      })

      if (!game) {
        throw apiError.unauthorized(responseMessage.GAME_NOT_FOUND);
      }
      let existingTicket = await findTicket({
        gameId: game._id,
        status: {
          $ne: status.DELETE
        },
      });

      if (existingTicket) {

        existingTicket = await updateTicket(validatedBody.title, validatedBody);
        return res.json(
          new response(existingTicket, responseMessage.UPDATE_SUCCESS)
        );
      }

      validatedBody.gameId = game._id
      let createTickets = await createTicket(validatedBody);
      return res.json(
        new response(createTickets, responseMessage.CREATE_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/updateTicket:
   *   put:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: updateTicket
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: ticketId
   *         description: ticketId
   *         in: formData
   *         required: true
   *       - name: ticketQuantity
   *         description: ticketQuantity
   *         in: formData
   *         required: true
   *       - name: amountInToken
   *         description: amountInToken
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async updateTicket(req, res, next) {
    const validationSchema = {
      ticketId: Joi.string().optional(),
      ticketQuantity: Joi.number().optional(),
      amountInToken: Joi.number().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);

      let adminResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let ticketValue = await findTicket({
        _id: validatedBody.ticketId,
        status: {
          $ne: status.DELETE
        },
      });
      if (!ticketValue) {
        throw apiError.notFound(responseMessage.CHIP_NOT_FOUND);
      }
      let updateRes = await updateTicket({
        _id: ticketValue._id
      },
        validatedBody
      );
      let activityObj = {
        adminId: adminResult._id,
        type: "UPDATE TICKET"
      }
      await createAdminActivity(activityObj)
      return res.json(new response(updateRes, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/getTickets:
   *   get:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: getTickets
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status (ACTIVE/BLOCK)
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
  async getTickets(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let ticket = await paginateTicket(validatedBody);
      if (!ticket) {
        throw apiError.notFound(responseMessage.CHIP_NOT_FOUND);
      }

      return res.json(new response(ticket, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/viewTicket:
   *   get:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: viewTicket
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
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewTicket(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var gameInfo = await findTicket({
        _id: validatedBody._id,
        status: {
          $ne: status.DELETE
        },
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(gameInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /ticket/userGetTickets:
   *   get:
   *     tags:
   *       - USER_TICKET_MANAGEMENT
   *     description: userGetTickets
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
  async userGetTickets(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let ticket = await ticketList({
        status: status.ACTIVE
      });
      if (!ticket) {
        throw apiError.notFound(responseMessage.CHIP_NOT_FOUND);
      }

      return res.json(new response(ticket, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/viewTicket:
   *   get:
   *     tags:
   *       - USER_TICKET_MANAGEMENT
   *     description: viewTicket
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
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewTicketUser(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var gameInfo = await findTicket({
        _id: validatedBody._id,
        status: status.ACTIVE,
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(gameInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /ticket/buyTicket:
   *   post:
   *     tags:
   *       - USER_TICKET_MANAGEMENT
   *     description: buyTicket
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: hash
   *         description: hash
   *         in: formData
   *         required: true
   *       - name: walletAddress
   *         description: walletAddress
   *         in: formData
   *         required: true
   *       - name: ticketId
   *         description: ticketId
   *         in: formData
   *         required: true
   *       - name: amount
   *         description: amount
   *         in: formData
   *         required: true
   *       - name: quantity
   *         description: quantity
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async buyTicket(req, res, next) {
    const validationSchema = {
      hash: Joi.string().required(),
      token: Joi.string().optional(),
      walletAddress: Joi.string().required(),
      ticketId: Joi.string().required(),
      amount: Joi.number().required(),
      quantity: Joi.number().required(),
    };
    try {

      let validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.USER_NOT_FOUND);
      }

      (validatedBody.userId = userResult._id),
        (validatedBody.status = ticketStatus.APPROVE);
      validatedBody.transactionType = "BUY";
      await updateUser({
        _id: userResult._id
      }, {
        $inc: {
          ticketBalance: validatedBody.quantity
        }
      });

      let transaction = await createTransaction(validatedBody);
      return res.json(new response(transaction, responseMessage.DATA_FOUND));
    } catch (error) {
      // Handle errors
      return next(error);
    }
  }




  /**
   * @swagger
   * /ticket/withDrawTwoFactorAuth:
   *   post:
   *     tags:
   *       - Ticket
   *     description: withDrawTwoFactorAuth
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: hash
   *         description: hash
   *         in: formData
   *         required: false
   *       - name: tokenName
   *         description: tokenName
   *         in: formData
   *         required: true
   *       - name: walletAddress
   *         description: walletAddress
   *         in: formData
   *         required: true
   *       - name: ticketId
   *         description: ticketId
   *         in: formData
   *         required: true
   *       - name: amount
   *         description: amount
   *         in: formData
   *         required: true
   *       - name: quantity
   *         description: quantity
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
  async withDrawTwoFactorAuth(req, res, next) {
    const validationSchema = {
      walletAddress: Joi.string()
        .required(),
      token: Joi.string()
        .required(),

      quantity: Joi.number().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      if (validatedBody.token === 'SOL') {
        let isSolanaWallet = false;
        try {

          isSolanaWallet = PublicKey.isOnCurve(validatedBody.walletAddress);

        } catch (error) {
          // If an error occurs, treat it as an invalid wallet
          isSolanaWallet = false;
        }
        if (!isSolanaWallet) {
          throw apiError.notFound("Invalid Solana wallet address");
        }
      } else {
        function isValidTonAddress(walletAddress) {
          try {
            Address.parse(walletAddress);
            return true;
          } catch (error) {
            return false;
          }
        }

        if (!isValidTonAddress(validatedBody.walletAddress)) {
          throw apiError.notFound("Invalid Ton wallet address");
        }
      }



      let userResult = await findUserData({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.USER_NOT_FOUND);
      }
      let ticketValue = await findTicket({
        status: status.ACTIVE,
      });
      if (!ticketValue) {
        throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
      }


      if (Number(userResult.ticketBalance) < Number(validatedBody.quantity)) {
        throw apiError.badRequest(responseMessage.INSUFFICIENT_BALANCE);
      }

      const settings = await WithdrawSettingServices.findWithdrawSetting({
        status: "ACTIVE", Symbol: validatedBody.token
      });


      if (!settings) {
        throw apiError.notFound("Withdraw Settings Not Found");
      }
      validatedBody.amount = ((validatedBody.quantity / ticketValue.ticketQuantity) * ticketValue.amountInToken).toFixed(4); // amount = quantity * ticketValue.
      validatedBody.userId = userResult._id;
      validatedBody.status = ticketStatus.PENDING;
      validatedBody.transactionType = "WITHDRAW";
      // validatedBody.token = "TON";
      validatedBody.charge = validatedBody.amount * (settings.Percentage_Charge / 100);
      validatedBody.AfterCharge = validatedBody.amount - validatedBody.charge;


      if (Number(validatedBody.amount) < Number(settings.Min_Withdraw) || Number(validatedBody.amount) > Number(settings.Max_Withdraw)) {
        throw apiError.badRequest("The withdrawal amount must be within the allowed range. Please check the minimum and maximum limits.");
      }
      let userwithdrawal = await getTransaction({ userId: req.userId, status: ticketStatus.PENDING, createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lte: new Date(new Date().setHours(23, 59, 59, 999)) } });
      if (userwithdrawal) {
        throw apiError.notFound("Your withdrawal request for today has already been submitted. Please try again tomorrow.");
      }




      let transaction = await createTransaction(validatedBody);
      let updateBal = await updateUser(
        { _id: userResult._id },
        {
          $inc: {
            lockedBalance: validatedBody.quantity,
            lockedAmount:
              Number(validatedBody.quantity) *
              Number(ticketValue.amountInToken),
            ticketBalance: -validatedBody.quantity,
          },
        }
      );

      if (!updateBal) {
        throw apiError.conflict("Failed to update balance");
      }
      const sendMessageUrl = `https://api.telegram.org/bot${process.env.Bot_Token}/sendMessage`;
      console.log(sendMessageUrl, "sendMessageUrl");

      const text = `Your withdrawal request has been submitted. Your withdrawal will be processed shortly`;
      console.log(text, "text");

      try {
        const response = await axios.get(sendMessageUrl, {
          params: {
            chat_id: userResult.chatId,
            text: text,
          },
        });
        if (response.data.ok) {
          console.log(`Notification sent to user ${user.chatId}`);
        } else {
          console.error(`Failed to send notification to user ${user.chatId}:`, response.data);
        }
      } catch (error) {
        if (error.response) {
          console.error(`Error sending notification to user ${user.chatId}:`, {
            status: error.response.status,
            data: error.response.data,
          });
        }
      }
      return res.json(
        new response(transaction, responseMessage.WITHDRAW_REQUEST)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/createWithdrawRequest:
   *   post:
   *     tags:
   *       - Ticket
   *     description: Withdraw with Two-Factor Authentication
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

  async createWithdrawRequest(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: status.ACTIVE

      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.USER_NOT_FOUND);
      }
      // if (userResult.email2FA) {

      //   var otp = commonFunction.getOTP();
      //   var newOtp = otp;
      //   var time = Date.now() + 180000;
      //   // await commonFunction.sendEmailForWithdrawal(userResult.email, otp,userResult.firstName);
      //   var updateResult = await updateUser({
      //     _id: userResult._id
      //   }, {
      //     $set: {
      //       withdrawOtp: newOtp,
      //       otpExpireTime: time
      //     }
      //   });
      //   return res.json(
      //     new response(updateResult, responseMessage.OTP_SEND)
      //   );
      // } else {
      //   return res.json(
      //     new response(userResult.google2FA, responseMessage.VERIFY_2FA_GO)
      //   )
      // }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/approveRejectWithdrawal:
   *   post:
   *     tags:
   *       - ADMIN_Ticket
   *     description: approveRejectWithdrawal by Admin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status
   *         in: formData
   *         required: true
   *       - name: reason
   *         description: reason
   *         in: formData
   *         required: false
   *       - name: transactionId
   *         description: transactionId
   *         in: formData
   *         required: true
   *       - name: hash
   *         description: hash
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async approveRejectWithdrawal(req, res, next) {
    const validationSchema = {
      transactionId: Joi.string().when('status', {
        is: Joi.valid('TRANSFERRED'),
        then: Joi.forbidden(),
        otherwise: Joi.required(),
      }),
      status: Joi.string().required(),
      hash: Joi.string().optional(),
      userIds: Joi.array().min(1).optional(),
      reason: Joi.string().optional()

    };



    try {

      let validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.USER_NOT_FOUND);
      }
      if (validatedBody.status != "TRANSFERRED") {
        var transactionId = await getTransaction({
          _id: validatedBody.transactionId,
          status: ticketStatus.PENDING,
          transactionType: "WITHDRAW",
        });
        if (!transactionId) {
          throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
        }

        var userId = await findUser({
          _id: transactionId.userId,
          userType: {
            $ne: userType.ADMIN
          },
          status: {
            $ne: status.DELETE
          },
        });

        if (!userId) {
          throw apiError.notFound(responseMessage.USERS_NOT_FOUND);
        }
      }

      if (validatedBody.status == "APPROVE") {

        const settings = await WithdrawSettingServices.findWithdrawSetting({ status: "ACTIVE", Symbol: transactionId.token });
        if (!settings) {
          throw apiError.notFound("Withdraw Settings Not Found")
        }

        if (transactionId.token === "TON") {

          const mintresponse = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usdt', {
            method: 'GET',
            headers: {},
          });

          const data = await mintresponse.json();
          var TransferTokens = (transactionId.AfterCharge / data.rates.TON.prices.USDT).toFixed(2);
          var Fee_tokens = (transactionId.charge / data.rates.TON.prices.USDT).toFixed(4)
          var TokenSymbol = 'TON'
        } else {
          const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${settings.Token_Mint}`, {
            method: 'GET',
            headers: {},
          });
          const data = await response.json();


          if (settings.Token_Mint == "So11111111111111111111111111111111111111112") {

            var TransferTokens =
              (transactionId.AfterCharge / data.pairs[0].priceUsd).toFixed(4)
              || "0.000";
            var Fee_tokens =
              (transactionId.charge / data.pairs[0].priceUsd).toFixed(4)
              || "0.000";
            var TokenSymbol = data.pairs[0].baseToken.symbol || 'Unknown'
          }

          else {
            var TransferTokens =
              (transactionId.AfterCharge / data.pairs[0].priceUsd).toFixed(2)
              || "0.000";
            var Fee_tokens =
              (transactionId.charge / data.pairs[0].priceUsd).toFixed(2)
              || "0.000";
            var TokenSymbol = data.pairs[0].baseToken.symbol || 'Unknown'



          }
        }




        let updateBalance = await updateUser({
          _id: userId._id
        }, {
          $inc: {

            lockedBalance: -transactionId.quantity,
            lockedAmount: -transactionId.amount,
          }
        });

        let updateTransactions = await updateTransaction({
          _id: transactionId._id
        }, {
          status: ticketStatus.APPROVE,
          Token_Amount: TransferTokens,
          Fee_tokens: Fee_tokens,
          Symbol: TokenSymbol,
          updatedDate: new Date()
        });


        return res.json(
          new response(updateTransactions, responseMessage.APPROVE)
        );
      }
      if (validatedBody.status == "REJECT") {
        let updateBalance = await updateUser({
          _id: userId._id
        }, {
          $inc: {
            lockedBalance: -transactionId.quantity,
            ticketBalance: transactionId.quantity,
            lockedAmount: -transactionId.amount,
          }
        });
        let updateTransactions = await updateTransaction({
          _id: transactionId._id
        }, {
          status: ticketStatus.REJECT,
          updatedDate: new Date()
        });
        const user = await findUser({ _id: userId._id });
        const sendMessageUrl = `https://api.telegram.org/bot${process.env.Bot_Token}/sendMessage`;
        const text = `Your withdrawal has been rejected due to ${validatedBody.reason}`;
        try {
          const response = await axios.get(sendMessageUrl, {
            params: {
              chat_id: user.chatId,
              text: text,
            },
          });

          if (response.data.ok) {
            console.log(`Notification sent to user ${chatId}`);
          } else {
            console.error(`Failed to send notification to user ${chatId}:`, response.data);
          }
        } catch (error) {
          if (error.response) {
            console.error(`Error sending notification to user ${chatId}:`, {
              status: error.response.status,
              data: error.response.data,
            });

          }
        }

        return res.json(
          new response(updateTransactions, responseMessage.REJECT)
        );
      }
      if (validatedBody.status === "TRANSFERRED") {
        console.log(validatedBody.userIds, "validatedBody.userIds", validatedBody.hash, "HAsh");

        const updatePromises = validatedBody.userIds.map(async (userId) => {
          const transaction = await getTransaction({
            _id: userId,
            status: ticketStatus.APPROVE,
            transactionType: "WITHDRAW",
          });

          if (!transaction) {
            throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
          }
          if (transaction.token === 'SOL') {
            const options = {
              method: "get",
              url: `${process.env.SOlSCAN_API_URL}${validatedBody.hash}`, // Corrected string interpolation
              headers: {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MzE0MDQzNDI4NTEsImVtYWlsIjoiaW5mb0BzdHJpbmdtZXRhdmVyc2UuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzMxNDA0MzQyfQ.SMLho5s-_pTBHYlZj2qV3OEq9Qwy8mh859xApQRcoBs"
              }
            };
            const responsedata = await axios(options);
            if (!responsedata.data.data.transfers) {
              throw apiError.conflict("Invalid Transaction Hash");
            }
            var transactionupdate = await updateTransaction(
              { _id: userId },
              {
                status: ticketStatus.TRANSFERRED,
                hash: validatedBody.hash,
                updatedDate: new Date(),

              },
              { new: true }
            );

          } else {
            const cell = Cell.fromBoc(Buffer.from(validatedBody.hash, "base64"))[0];
            const transactionhash = cell.hash().toString("hex");
            console.log(transactionhash, "transactionhash");

            if (!transactionhash) {
              throw apiError.conflict("Transaction sent but no hash found");

            }
            // const tonApiResponse = await axios
            //   .get(`https://tonapi.io/v2/traces/${transactionhash}`)
            //   .then(res => res.data)
            //   .catch(err => {
            //     console.error("Error fetching from TON API:", err.response.data || err.message);
            //     return null;
            //   });

            // console.log(tonApiResponse, "tonApiResponse");

            // if (!tonApiResponse || tonApiResponse.transaction.action_phase.fwd_fees <= 0) {
            //   throw apiError.conflict("Invalid TON Transaction Hash");

            // }
            var transactionupdate = await updateTransaction(
              { _id: userId },
              {
                status: ticketStatus.TRANSFERRED,
                hash: transactionhash,
                updatedDate: new Date(),

              },
              { new: true }
            );


          }

          console.log(`Transaction updated for userId: ${userId}`);

          const user = await findUser({ _id: transaction.userId });
          const sendMessageUrl = `https://api.telegram.org/bot${process.env.Bot_Token}/sendMessage`;
          const text = `Your withdrawal request has been successfully completed. Kindly verify your wallet for the updated balance.`;

          await axios.get(sendMessageUrl, {
            params: {
              chat_id: user.chatId,
              text: text,
            },
          });

          return transactionupdate;
        });


        await Promise.all(updatePromises);


        return res.json(new response([], responseMessage.TRANSFER));
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/transactionHistory:
   *   get:
   *     tags:
   *       - ADMIN_TRANSACTION_LIST
   *     description: get transaction list for particular user
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
   *       - name: transactionType
   *         description: transactionType
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: notEqual
   *         description: notEqual
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: Data not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */

  async transactionHistory(req, res, next) {
    const validationSchema = {
      userId: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      transactionType: Joi.string().optional(),
      status: Joi.string().optional(),
      notEqual: Joi.string().optional(),
      userName: Joi.string().optional(),
      Symbol: Joi.string().optional()
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
      let transactionHistory = await transactionPaginateSearch(validatedBody);
      if (transactionHistory.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }


      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/viewTransactionHistory:
   *   get:
   *     tags:
   *       - ADMIN_TRANSACTION_LIST
   *     description: get transaction list for particular user
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: transactionId
   *         description: transactionId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: Data not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async viewTransactionHistory(req, res, next) {
    const validationSchema = {
      transactionId: Joi.string().optional(),
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
      let transactionHistory = await getTransaction({
        _id: validatedBody.transactionId,
      });
      if (!transactionHistory) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /ticket/transactionListUser:
   *   get:
   *     tags:
   *       - USER_Transaction
   *     description: get transaction list for  user
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
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
   *       - name: transactionType
   *         description: transactionType
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: walletAddress
   *         description: walletAddress
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: Data not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */

  async transactionListUser(req, res, next) {
    const validationSchema = {
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      transactionType: Joi.string().optional(),
      status: Joi.string().optional(),
      search: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      validatedBody.userId = userResult._id;
      let transactionHistory = await transactionPaginateSearch(validatedBody);
      if (transactionHistory.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(transactionHistory, responseMessage.DATA_FOUND)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/blockTicket:
   *   put:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: blockTicket
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: ticketId
   *         description: ticketId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async blockTicket(req, res, next) {
    const validationSchema = {
      ticketId: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var ticketInfo = await findTicket({
        _id: validatedBody.ticketId,
        status: {
          $ne: status.DELETE
        },
      });
      if (!ticketInfo) {
        throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
      }
      if (ticketInfo.status == status.ACTIVE) {
        let blockRes = await updateTicket({
          _id: ticketInfo._id
        }, {
          status: status.BLOCK
        });
        return res.json(
          new response(blockRes, responseMessage.BLOCK_TICKET_BY_ADMIN)
        );
      } else {
        let activeRes = await updateTicket({
          _id: ticketInfo._id
        }, {
          status: status.ACTIVE
        });
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_TICKET_BY_ADMIN)
        );
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /ticket/deleteTicket:
   *   delete:
   *     tags:
   *       - ADMIN_TICKET_MANAGEMENT
   *     description: blockTicket
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: ticketId
   *         description: ticketId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteTicket(req, res, next) {
    const validationSchema = {
      ticketId: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      var ticketInfo = await findTicket({
        _id: validatedBody.ticketId,
        status: {
          $ne: status.DELETE
        },
      });
      if (!ticketInfo) {
        throw apiError.notFound(responseMessage.TICKET_NOT_FOUND);
      }

      let blockRes = await updateTicket({
        _id: ticketInfo._id
      }, {
        status: status.DELETE
      });
      return res.json(new response(blockRes, responseMessage.TICKET_DELETED));
    } catch (error) {
      return next(error);
    }
  }

  async WithdrawSetting(req, res, next) {

    const validationSchema = {
      id: Joi.string().allow('').optional(),
      Symbol: Joi.string().optional(),
      Fee_wallet: Joi.string().required(),
      Fixed_Charge: Joi.number().required(),
      Percentage_Charge: Joi.number().required(),
      Token_Mint: Joi.string().required(),
      Min_Withdraw: Joi.number().required(),
      Max_Withdraw: Joi.number().required(),
      Withdraw_Note: Joi.string().required()
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);


      if (validatedBody.id) {

        let updatestatus = await WithdrawSettingServices.updateWithdrawSettingById(validatedBody.id, { status: "INACTIVE" });
        if (!updatestatus) {
          throw apiError.conflict("Unable to Update settings");
        }

        const { id: _, ...newWithdrawSettingData } = req.body;
        var WithdrawSetting = await WithdrawSettingServices.createWithdrawSetting(newWithdrawSettingData);
        if (!WithdrawSetting) {
          throw apiError.conflict("Unable to create new settings");
        }

      } else {

        var WithdrawSetting = await WithdrawSettingServices.createWithdrawSetting(validatedBody);
        if (!WithdrawSetting) {
          throw apiError.conflict("Unable to Create settings");
        }

      }
      return res.json(new response(WithdrawSetting, "Withdraw Setting added successfully"));
    } catch (error) {
      return next(error);
    }
  };


  async getWithdrawSettings(req, res, next) {

    try {
      if (req.body.id) {
        var withdrawSettings = await WithdrawSettingServices.findWithdrawSettingById(req.body.id);
        if (!withdrawSettings) {
          throw apiError.notFound(`Data Not Found for ${req.body.id}`);
        }
      } else {
        var withdrawSettings = await WithdrawSettingServices.findWithdrawSettingAll();
        if (!withdrawSettings) {
          throw apiError.notFound("Data Not Found");
        }
      }

      return res.json(new response(withdrawSettings, "Withdraw Settings retrieved successfully")); // Return the paginated withdraw settings
    } catch (error) {

      return next(error);
    }
  };






}
export default new ticketController();