import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import bcrypt from "bcryptjs";

var userModel = new Schema(
  {
    chatId: {
      type: String,
      unique:true,
      index:true,
      required: [true, 'Path `chatId` is required.']
    },
    email: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    userName: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
    },
    withdrawOtp: {
      type: String,
    },
    emailotp2FA: {
      type: Number,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      enum: [userType.ADMIN, userType.SUBADMIN, userType.USER],
      default: userType.USER,
    },
    status: {
      type: String,
      enum: [status.ACTIVE, status.BLOCK, status.DELETE],
      default: status.ACTIVE,
    },
    address: {
      type: String,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    otpExpireTime: {
      type: Number,
    },
    profilePic: {
      type: String,
    },
    bannerPic: {
      type: String,
    },
    wallet: {
      type: String,
      default: "",
    },
    private_key: {
      type: String,
    },
    bio: {
      type: String,
    },
    socialId: {
      type: String,
    },
    socialType: {
      type: String,
    },
    ticketBalance: {
      type: Number,
      default: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
    },
    lockedAmount: {
      type: Number,
      default: 0,
    },
    secretGoogle: {
      type: String,
    },
    base64: {
      type: String,
    },
    referralCode: { type: Number },

    referrerId: {
      type: Mongoose.Types.ObjectId,
      ref: "user",
    },
    adsRewardEndtime: {
      type: Date,
      timestamps: true,
    },
    adsRewardEndtime2: {
      type: Date,
      timestamps: true,
    },
    google2FA: { type: Boolean, default: false },
    email2FA: { type: Boolean, default: false },
    permissions: [],
    changeUserName: { type: Boolean, default: true },
    changeFirstName: { type: Boolean, default: true },
    changeLastName: { type: Boolean, default: true },
    gameSound: {
      type: Boolean,
      default: true,
    },

    gameMusic: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

userModel.index({ location: "2dsphere" });
userModel.plugin(mongooseAggregatePaginate);
userModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("user", userModel);

(async () => {
  let result = await Mongoose.model("user", userModel).find({
    userType: userType.ADMIN,
  });

  if (result.length != 0 && result.userType != "ADMIN") {
    // console.log("Default Admin updated.");
  } else {
    let obj = {
      userType: userType.ADMIN,
      firstName: "admin",
      lastName: "admin",
      userName: "Admin123",
      countryCode: "+91",
      mobileNumber: "123456789",
      email: "support@stringarc8.io",
      dateOfBirth: "13/01/2003",
      password: bcrypt.hashSync("Admin@123"),
      address: "Delhi, India",
      wallet: "4NXuSXiCe17M5Szf2TDbAF7zXUPLvqAsy3uXwFevDxw3",
      private_key: "ffdgdfgdfgd",
      otpVerified: true,
      chatId: "some_chat_id",
      profilePic:
        "https://res.cloudinary.com/dtwlov1bu/image/upload/v1730099085/cvdz0cuepvoewenawsxx.png",
    };
    var defaultResult = await Mongoose.model("user", userModel).create(obj);
  }

  if (defaultResult) {
    console.log("DEFAULT DATA Created.", defaultResult);
  }
}).call();
