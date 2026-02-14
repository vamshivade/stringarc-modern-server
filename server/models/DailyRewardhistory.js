const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const DailyRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    Reward_Amount: { type: Number, default: null },
    Status:{
      type: String
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

 DailyRewardSchema.plugin(mongoosePaginate);
 DailyRewardSchema.plugin(mongooseAggregatePaginate);
const Daily_Reward_History = mongoose.model(
  "Daily_Reward_History",
  DailyRewardSchema
);
module.exports = Daily_Reward_History;
