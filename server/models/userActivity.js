import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import bcrypt from "bcryptjs";

var userActivityModel = new Schema(
  {
    userId:{
        type:Mongoose.Types.ObjectId,
        ref:"user"
    },
    type:{
    type:String
    },
    old:{type:String,default:""},
    new:{type:String,default:""},
    status: {
      type: String,
      default: status.ACTIVE,
    },
  
  },
  { timestamps: true }
);

userActivityModel.index({ location: "2dsphere" });
userActivityModel.plugin(mongooseAggregatePaginate);
userActivityModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("userActivity", userActivityModel);