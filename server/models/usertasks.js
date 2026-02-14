const mongoose = require('mongoose');
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const UsertaskSchema = new mongoose.Schema({

    user_id: {
       
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    TaskId: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    Rewardpoints: {
        type: Number,
        
    },
    Status: {
        type: String,
       
    },
    InitialBalance:{ type: Number, default: null },
    FinalBalance:{type:Number, default:null},
}, {
    timestamps: true,
    toJSON: { virtual: true },
    toObject: { virtual: true },
});

UsertaskSchema.plugin(mongooseAggregatePaginate);
UsertaskSchema.plugin(mongoosePaginate);
const Usertasks = mongoose.model('Usertasks', UsertaskSchema);
module.exports = Usertasks;   