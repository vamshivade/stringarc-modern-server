import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import bcrypt from "bcryptjs";

var adminActivityModel = new Schema(
  {
    userId:{
        type:Mongoose.Types.ObjectId,
        ref:"user"
    },
    adminId:{
        type:Mongoose.Types.ObjectId,
        ref:"user"
    },
    type:{
    type:String
    },

    status: {
      type: String,
      default: status.ACTIVE,
    },
  
  },
  { timestamps: true }
);

adminActivityModel.index({ location: "2dsphere" });
adminActivityModel.plugin(mongooseAggregatePaginate);
adminActivityModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("adminActivity", adminActivityModel);