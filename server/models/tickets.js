import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import config from "config";
import CryptoJS  from "crypto-js"
let aesKey =process.env.aesKey;
var ticketModel = new Schema(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'game'
    },
    amountInToken: {
      type: String,
    },
    ticketQuantity: {
      type: String,
      default:1
    },
    status: {
      type: String,
      default: status.ACTIVE,
    },
    defaultAdminWallet:{
      type:String,
    }
  },
  { timestamps: true }
);

ticketModel.plugin(mongooseAggregatePaginate);
ticketModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("ticket", ticketModel);

(async () => {
  let result = await Mongoose.model("ticket", ticketModel).find({});
  if (result.length != 0) {
    // console.log("Default ticket already created.");
  } else {
   
      let data = process.env.adminWallet;
      let ciphertext = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        aesKey
      ).toString();
     

    var obj1 = {
      title: "Arcade Ticket 1",
      ticketPic:
        "",
      tokenName: "Solana",
      ticketQuantity: 1,
      amountInToken: 2,
      defaultAdminWallet:ciphertext
    };

    let staticResult = await Mongoose.model("ticket", ticketModel).create(obj1);
    if (staticResult) {
      console.log("DEFAULT ticket Created.", staticResult);
    }
  }
}).call();
