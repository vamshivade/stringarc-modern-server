const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const ReferralHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    Referral_Amount: { type: Number, default: null },
    InitialBalance:{
      type:Number, default:null
    },
    FinalBalance:{
      type:Number, default:null
    },
    ReferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index:true
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
ReferralHistorySchema.plugin(mongoosePaginate);
ReferralHistorySchema.plugin(mongooseAggregatePaginate);
const Referral_History = mongoose.model(
  "Referral_History",
  ReferralHistorySchema
);
module.exports = Referral_History;
