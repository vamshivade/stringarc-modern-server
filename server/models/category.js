import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from "../enums/status";
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var categorySchema = new schema(
  {
    categoryTitle: {
      type: String,
    },
    categoryIcon: {
      type: String,
      default: "",
    },
    categoryIcon2: {
      type: String,
      default: "",
    },
    sampleIconColored: {
      type: String,
      default:
        "https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098882/wykkjahthpxzlkollj7g.svg",
    },
    sampleIconWithOutColored: {
      type: String,
      default:
        "https://res.cloudinary.com/dtwlov1bu/image/upload/v1730098948/sbjvngt42xhkormfdksa.svg",
    },
    status: { type: String, default: status.ACTIVE },
  },
  { timestamps: true }
);

categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("category", categorySchema);
