const mongoose = require('mongoose');
import status from '../enums/Taskstatus';
const BoosterSettingSchema = new mongoose.Schema({
    Name: {
        type: String,
        unique: true,
        index: true
    },
    Image: {
        type: String,

    },
    Price: {
        type: Number,

    },
    Description: {
        type: String,
    },
    Booster_Multiplier: {
        type: Number
    },
    Timer_InMinutes: {
        type: Number,
    },
    Status: {
        type: String,
        enums: ["ACTIVE", "INACTIVE", "DELETE"],
        default: status.ACTIVE
    },
    AddedBy: {
        type: String,
    }
}, {
    timestamps: true,
});
// General Setting Schema
const BoosterSetting = mongoose.model('Boosters', BoosterSettingSchema);
module.exports = BoosterSetting;