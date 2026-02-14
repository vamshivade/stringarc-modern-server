import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var bannerSchema = new schema({

    bannerImage: {
        type: String
    },
    bannerURL: {
        type: String,
    },
    status: { type: String, default: status.ACTIVE }
}, { timestamps: true }
);

bannerSchema.plugin(mongoosePaginate);
bannerSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("banner", bannerSchema);

