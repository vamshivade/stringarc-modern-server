import Booster from "../../../models/Booster";
import status from "../../../enums/Taskstatus";
import BoosterTransaction from "../../../models/BoosterTransaction";
import userModel from "../../../models/user";
import { logger } from "ethers";

const BoosterServices = {
  createBooster: async (insertObj) => {
    return await Booster.create(insertObj);
  },

  findBooster: async (query) => {
    return await Booster.findOne(query);
  },

  findBoosterAll: async (query) => {
    return await Booster.find(query);
  },
  findBoosterById: async (query) => {
    return await Booster.findById(query);
  },

  searchBooster: async (validatedBody) => {
    let query = {
      BoosterTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await Booster.paginate(query, options);
  },

  BoosterCount: async (query) => {
    return await Booster.countDocuments(query);
  },

  updateBooster: async (query, updateObj) => {
    return await Booster.findOneAndUpdate(query, updateObj, { new: true });
  },

  updateBoosterById: async (query, updateObj) => {
    return await Booster.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateBooster: async (validatedBody) => {
    let query = {};
    const { search, fromDate, toDate, page, limit, status } =
      validatedBody;

    if (search) {
      query.$or = [{ Name: { $regex: search, $options: "i" } }];
    }

    if (status) {
      query.Status = status;
    }
    
   
    if (fromDate && !toDate) {
      query.createdAt = { $gte: fromDate };
    }
    if (!fromDate && toDate) {
      query.createdAt = { $lte: toDate };
    }
    if (fromDate && toDate) {
      query.$and = [
        { createdAt: { $gte: fromDate } },
        { createdAt: { $lte: toDate } },
      ];
    }
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 }
    };
    return await Booster.paginate(query, options);
  },


//user services
getBoosterByIdAndBoosterId: async(transactionId, Booster_Id, userId)=> {
  try {
      const booster = await BoosterTransaction.findOne({
          _id: transactionId,
          Booster_Id: Booster_Id,
          User_Id: userId
      }).populate('Booster_Id');

      return booster;
  } catch (error) {
      console.error('Error retrieving booster by ID and Booster_Id:', error);
      throw new Error('Error retrieving booster by ID and Booster_Id');
  }
},

getBoostersByBoosterId: async(Booster_Id, userId)=>{
      const boosters = await BoosterTransaction.find({
          Booster_Id: Booster_Id,
          User_Id: userId
      }).populate('Booster_Id');
      return boosters;
},


 getAllBoosters: async(userId)=>{
  try {
      const boosters = await BoosterTransaction.find({
          User_Id: userId
      }).populate('Booster_Id');
      return boosters;
  } catch (error) {
      console.error('Error retrieving all boosters:', error);
      throw new Error('Error retrieving all boosters');
  }
},
getUserWalletByUserId: async (userId) => {
  return await userModel.findOne({ _id: userId });
},

};

export { BoosterServices };
