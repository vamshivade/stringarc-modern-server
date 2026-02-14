const mongoose = require('mongoose');
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";

const BoosterTransactionSchema = new mongoose.Schema({
    User_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        index:true
      },
    Amount: {
        type: Number,
        
    },
   Charge: {
        type: Number,
       
    },
    TransactionHash: {
        type: String,
    },
    Booster_Id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boosters",
        index:true
    },
    BoosterStart:{
         type: Date,
         timestamps: true
    },
    BoosterEnd:{
        type: Date,
        timestamps: true  
    },
    Status:{
        type: String,
        default:"PENDING",
        index:true
    }
}, {
    timestamps: true,
});

BoosterTransactionSchema.plugin(mongooseAggregatePaginate);
BoosterTransactionSchema.plugin(mongoosePaginate);
// General Setting Schema
const BoosterTransaction = mongoose.model('Booster_Transactions', BoosterTransactionSchema);
module.exports = BoosterTransaction;