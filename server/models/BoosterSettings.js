const mongoose = require('mongoose');

const BoosterSettingsSchema = new mongoose.Schema({
    BoosterWalletAddress:{
        type:String,
        default:null,
    },
    Booster_Note1:{
        type:String,
        default:null,
    },
    Booster_Note2:{
        type:String,
        default:null,
    },
    Booster_Content:{
        type:String,
        default:null,
    },
    BoosterMintAddress:{
        type:String,
        default:null,
    },
    AddedBy:{
        type:String,
        default:null,
    },
    Status: {
        type: String,
        default: "ACTIVE"
    },

}, {
    timestamps: true,
    toJSON: { virtual: true },
    toObject: { virtual: true },
});
const BoosterSettings = mongoose.model('Booster_Settings', BoosterSettingsSchema);
module.exports = BoosterSettings;
