const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const AdsRewardHistoryschema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    AdId:{
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    NextAd_Time:{
      type: Date
      
    },
    Rewardpoints: {
      type: Number,
      default: 0,
    },
    InitialBalance:{
      type:Number, default:null
    },
    FinalBalance:{
      type:Number, default:null
    }
  },
  {
    timestamps: true,
    toJSON: { virtual: true },
    toObject: { virtual: true },
  }
);
AdsRewardHistoryschema.plugin(mongoosePaginate);
AdsRewardHistoryschema.plugin(mongooseAggregatePaginate);
const AdsrewardHistory = mongoose.model(
  "Ads_Reward History",
  AdsRewardHistoryschema
);
module.exports = AdsrewardHistory;
