import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var blockListUserNameSchema = new schema({

    userName: [{
      userName:String,
      created:{type :Date}
    }],
    email:[{
      email:String,
      created:{type :Date}
    }],
    status: { type: String, default: status.ACTIVE }
}, { timestamps: true }
);

blockListUserNameSchema.plugin(mongoosePaginate);
blockListUserNameSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("blockedUserName", blockListUserNameSchema);


(async () => {
    let result = await Mongoose.model("blockedUserName", blockListUserNameSchema).find({
    });
  
    if (result.length != 0 ) {
      
    } else {
      let obj = {
        userName:[],
        email:[]
      };
      var defaultResult = await Mongoose.model("blockedUserName", blockListUserNameSchema).create(obj);
    }
  
    if (defaultResult) {
      console.log("DEFAULT Block Management Created.", defaultResult);
    }
  }).call();
  