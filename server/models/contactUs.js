import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';

const options = {
    collection: "contactus",
    timestamps: true
};

const schemaDefination = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user"
        },
        message: { type: String },
        firstName: { type: String },
        email: { type: String },
        status: { type: String, default: status.ACTIVE },
        reply:{type:Boolean,default:false},
        replyMsg:{type:String,},
        lastName: { type: String },
    },
    options
);

schemaDefination.plugin(mongooseAggregatePaginate);
schemaDefination.plugin(mongoosePaginate);
module.exports = Mongoose.model("contactus", schemaDefination);

