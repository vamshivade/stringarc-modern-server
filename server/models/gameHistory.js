import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from "../enums/status";
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var gameHistorySchema = new schema(
  {
    userId: {
      type: Mongoose.Types.ObjectId,
      ref: "user",
    },
    gameTitle: {
      type: String,
    },
    gameId: {
      type: String,
    },
    gameCode: {
      type: Number,
    },
    level: {
      type: Number,
      default: 1,
    },
    prize: {
      type: Number,
      default: 0,
    },
    betAmount: {
      type: Number,
    },
    time: {
      type: Number,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    playedStatus: {
      type: String,
      enum: ["WON", "LOSE", "QUIT"],
    },
    initialbalance: {
      type: Number,
      default: null
    },
    finalbalance: {
      type: Number,
      default: null
    },
    gameStatus: {
      type: String,
      enum: ["PLAYING", "COMPLETED"],
      default: "PLAYING",
    },
    status: { type: String, default: status.ACTIVE },
  },
  { timestamps: true }
);

gameHistorySchema.plugin(mongoosePaginate);
gameHistorySchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("gameHistory", gameHistorySchema);
