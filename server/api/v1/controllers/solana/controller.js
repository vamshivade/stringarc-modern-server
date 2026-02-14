import Joi from "joi";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util"
import status from "../../../../enums/status";
import Config from "config";
const coinTicker = require("coin-ticker");
const { Connection, PublicKey } = require("@solana/web3.js");
import { userServices } from "../../services/user";
const {
  findUser,
  updateUser,
  updateUserById,
} = userServices;

const solanaPrice = process.env.solanaPrice
export class solanaController {
  /**
   * @swagger
   * /solana/solanaInUSDT:
   *   post:
   *     tags:
   *       - Solana
   *     description: get USDT conversion
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: amount
   *         description: amount
   *         in: formData
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

  async solanaInUSDT(req, res, next) {
    try {
      const amount = parseFloat(req.body.amount);

      if (isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount provided" });
      }

      // Fetch the SOL to USD conversion rate from the Bitfinex API using coinTicker
      const pairs = await coinTicker("bitfinex", "SOL_USD");

      // Check if the pair information is available
      if (!pairs || !pairs.last) {
        return res.status(500).json({ error: "Conversion pair not available" });
      }

      const usdToSolRate = parseFloat(1 / pairs.last);
      const convertedAmount = amount * usdToSolRate;
      res.json({ usd: amount, sol: convertedAmount, rate: usdToSolRate });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /solana/getSolanaBalance:
   *   post:
   *     tags:
   *       - Solana
   *     description: get Solana Balance
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: walletAddress
   *         description: walletAddress
   *         in: formData
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

  async getSolanaBalance(req, res, next) {
    const connection = new Connection(solanaPrice);
    const walletAddress = req.body.walletAddress;
    const publicKey = new PublicKey(walletAddress);
    try {
      const accountInfo = await connection.getAccountInfo(publicKey);
      const solBalance = accountInfo ? accountInfo.lamports / 1e9 : 0;
      return res.json({ balanceOfWallet: solBalance });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /solana/connectWallet:
   *   post:
   *     tags:
   *       - Solana
   *     description: connect wallet
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: walletAddress
   *         description: walletAddress
   *         in: formData
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

  async connectWallet(req, res, next) {
    try {
      const walletAddress = req.body.walletAddress;
      if (!walletAddress) {
        throw apiError.notFound(responseMessage.INVALID_DATA);
      }

      const userResult = await findUser({
        _id: req.userId,  
        status: { $ne: status.DELETE },
      });


      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (userResult.wallet && userResult.wallet.includes(walletAddress)) {
        return res.json(new response("", responseMessage.WALLET_CONNECT));
    } else if (userResult.wallet === "") {
      
        const updateResult = await updateUser(
            { _id: userResult._id },
            { $set: { wallet: walletAddress } },
            { new: true }
        );
        await commonFunction.sendEmailForConnectWallet(userResult.email,userResult.firstName,updateResult.wallet);
       
        return res.json(new response(updateResult, responseMessage.WALLET_CONNECT));
    } else {
        
        throw apiError.notFound(responseMessage.INVALID_WALLET);
    }} catch (error) {
      return next(error);
    }
  }

 



}

export default new solanaController();
