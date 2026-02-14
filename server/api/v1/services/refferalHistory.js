import ReferralHistory from "../../../models/Referralhistory";
import User from "../../../models/user";


const ReferralHistoryServices = {
  createReferralHistory: async (insertObj) => {
    return await ReferralHistory.create(insertObj);
  },

  findReferralHistory: async (query) => {
    return await ReferralHistory.findOne(query);
  },

  findReferralHistoryAll: async (query) => {
    return await ReferralHistory.find(query);
  },
  findReferralHistoryById: async (query) => {
    return await ReferralHistory.findById(query);
  },

  findReferralCountByUserId: async (userId) => {
    const user = await User.findOne({ chatId: userId });
    return await ReferralHistory.countDocuments({ ReferredBy: user._id });
  },



  searchReferralHistory: async (validatedBody) => {
    let userId = null;
    if (validatedBody.search) {
      // Search for the userId based on the userName
      const user = await User.findOne({ userName: { $regex: validatedBody.search, $options: "i" } });
      if (user) {
        userId = user._id;
      }

      // If booster is found, get the boosterId
    
    }

    // Step 2: Build the query for ReferralHistory
    let query = {};

    // Step 3: Set pagination options
    let options = {
      page: Number(validatedBody.page) ,
      limit: Number(validatedBody.limit) ,
      sort: { createdAt: -1 },
      populate: { path: 'User_Id', select: 'username' } // Include populate here
    };
    return await ReferralHistory.paginate(query, options);
  },

  ReferralHistoryCount: async (query) => {
    return await ReferralHistory.countDocuments(query);
  },

  updateReferralHistory: async (query, updateObj) => {
    return await ReferralHistory.findOneAndUpdate(query, updateObj, { new: true });
  },



  updateReferralHistoryById: async (query, updateObj) => {
    return await ReferralHistory.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateReferralHistory: async (validatedBody) => {
    let query = {};
    const { fromDate, search,ReferredBy,userId, toDate, page, limit} = validatedBody;
    
    if (search) {

      const user = await User.findOne({ userName:  validatedBody.search });

      if (user) {
        query.userId = user._id;
      }

    }
    if(userId){
      query.userId = userId;
    }
    if (ReferredBy) {
      
        query.ReferredBy =ReferredBy;
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
      page: Number(page)||1 ,
      limit: Number(limit)||10 ,
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'userName' },
        { path: 'ReferredBy',select: 'userName' }
      ]
       // Include populate here
    };

    return await ReferralHistory.paginate(query, options);
  }
};

export { ReferralHistoryServices };
