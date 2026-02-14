const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
  const DailyRewardplanSchema = new mongoose.Schema( 
    { 
     Reward_Amount:{
      type: Number, 
      default: 0, 
     },
      Addedby:{
        type:mongoose.Types.ObjectId,
        ref:"user",
      },
       
      Status: { 
        type: String, 
        default: "ACTIVE", 
      }, 
    }, 
    { 
      timestamps: true, 
      toJSON: { virtual: true }, 
      toObject: { virtual: true }, 
    } 
  );
  DailyRewardplanSchema.plugin(mongoosePaginate);
  DailyRewardplanSchema.plugin(mongooseAggregatePaginate);

const DailyRewardplan = mongoose.model("daily_reward_plan",DailyRewardplanSchema);
module.exports = DailyRewardplan;
