import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from "../enums/status";
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");

const levelSchema = new Schema({
  level: { type: String, default: "1" },
  multiplier: { type: String, default: "1" },
  additionalParams: {
    type: Map,
    of: String,
    default: {},
  },
});

const gameSchema = new Schema(
  {
    gameTitle: { type: String },
    gameDetails: { type: String },
    gamePic: { type: String },
    category: { type: String },
    levelPrice: { type: Number, default: 1.5 },
    level: { type: [levelSchema], default: [] },
    additionalParams: {
      type: Map,
      of: String,
      default: {},
    },
    rules: { type: Array },
    withdrawalRules: { type: Array },
    disclaimer: { type: String },
    latest: { type: Boolean, default: false },
    min: { type: Number, default: 10 },
    max: { type: Number, default: 30 },
    status: { type: String, default: status.ACTIVE },
  },
  { timestamps: true },
);

gameSchema.plugin(mongoosePaginate);
gameSchema.plugin(mongooseAggregatePaginate);

module.exports = mongoose.model("game", gameSchema);
