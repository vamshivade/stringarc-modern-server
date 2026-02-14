const mongoose = require("mongoose");
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import taskStatus from "../enums/Taskstatus";
const TaskDataSchema = new mongoose.Schema({
    TaskName: { type: String, default: null },
    Subtask: { type: String, default: null },
    Description: { type: String, default: null },
    Sitelink: { type: String, default: null },
    TaskImage: { type: String, default: null },
    Siteimg: { type: String, default: null },
    Rewardpoints: { type: Number, default: 0 },
    Status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETE"],
        default: taskStatus.ACTIVE
    },
},
    {
        timestamps: true,
        toJSON: { virtual: true },
        toObject: { virtual: true },
    });

TaskDataSchema.plugin(mongooseAggregatePaginate);
TaskDataSchema.plugin(mongoosePaginate);
const TaskData = mongoose.model("Task_Data", TaskDataSchema);
module.exports = TaskData;