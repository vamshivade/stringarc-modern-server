const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
import taskStatus from "../enums/Taskstatus";
const AdsSchema = new mongoose.Schema({
    AdName: { type: String, default: null },
    AdSDK: { type: String, default: null },
    AdImage: { type: String, default: null },
    Rewardpoints: { type: Number, default: 0 },
    AdCount: {
        type: Number,
        default: 0,
    },
    AdTimer_InMinutes: {
        type: Number,
        default: 0,
    },

    AddedBy: { type:mongoose.Types.ObjectId,
        ref:"user" },
   Status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETE"],
        default: taskStatus.ACTIVE
    },
},
    {
        timestamps: true,
        toJSON: { virtual: true },
        toObject: { virtual: true },
    });

AdsSchema.plugin(mongooseAggregatePaginate);
AdsSchema.plugin(mongoosePaginate);
const AdsData = mongoose.model("Ads_Data", AdsSchema);
module.exports = AdsData;