// import Mongoose, { Schema } from "mongoose";
// import mongoosePaginate from "mongoose-paginate";
// import status from '../enums/status';
// var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
// const schema = Mongoose.Schema;
// var leadBoardSchema = new schema({
// userId:{
//     type:Mongoose.Types.ObjectId,
//     ref:"user"
// },
// gameId:{
//     type:Mongoose.Types.ObjectId,
//     ref:"game"
// },
// timeSpent:{
//     type:Number,
//     default:0
// },
// highestScore:{
//     type:Number,
//     default:0
// },
// rewardTicket:{
//     type:Number,
//     default:0
// }

// }, { timestamps: true }
// );

// leadBoardSchema.plugin(mongoosePaginate);
// leadBoardSchema.plugin(mongooseAggregatePaginate);
// module.exports = Mongoose.model("leadBoard", leadBoardSchema);

