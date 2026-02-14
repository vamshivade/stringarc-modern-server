import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import ticketStatus from "../enums/Taskstatus";

var WithdrawSettingsModel = new Schema(
  {
    
    Fee_wallet: {
      type: String,
    },
    Token_Mint:{
      type: String,
    },
    Min_Withdraw: {
      type: Number,
    },
    Max_Withdraw: {
      type: Number,
    },
    Withdraw_Note:{
      type: String,
    },
    Percentage_Charge: {
      type: Number,
    },
    Fixed_Charge: {
      type: Number,
    },
    Symbol: {
      type: String,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETE"],
        default: ticketStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

WithdrawSettingsModel.plugin(mongooseAggregatePaginate);
WithdrawSettingsModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("WithdrawSetting", WithdrawSettingsModel);
