import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const options = {
    collection: "faq",
    timestamps: true
};

const schemaDefination = new Schema(
    {
        question: { type: String },
        answer: { type: String },
        image: { type: String },
        url: { type: String },
        screenName: { type: String },
        status: { type: String, default: status.ACTIVE }
    },
    options
);
schemaDefination.plugin(mongoosePaginate);
schemaDefination.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("faq", schemaDefination);

