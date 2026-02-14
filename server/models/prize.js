import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var prizeSchema = new schema({

    prize: {
        type: Number
    },
    gameId:{
      type: Schema.Types.ObjectId,
      ref: 'game'
    },
    status: { type: String, default: status.ACTIVE }
}, { timestamps: true }
);

prizeSchema.plugin(mongoosePaginate);
prizeSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("levelPrize", prizeSchema);

