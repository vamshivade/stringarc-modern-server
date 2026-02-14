
import User from "../../../models/user";
import DailyRewardHistory from "../../../models/DailyRewardhistory";
import { populate } from "../../../models/adminSettings";
const DailyClaimServices = {
  createDailyRewardHistory: async (insertObj) => {
    return await DailyRewardHistory.create(insertObj);
  },
  hasExistingClaimToday: async (userId) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await DailyRewardHistory.findOne({
      userId: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
  },
  findDailyClaim: async (query) => {
    return await DailyRewardHistory.find(query);
  },

  findOneDailyClaim: async (query) => {
    return await DailyRewardHistory.findOne(query);
  },



  DailyRewardHistoryCount: async (query) => {
    return await DailyRewardHistory.countDocuments(query);
  },

  updateDailyRewardHistory: async (query, updateObj) => {
    return await DailyRewardHistory.findOneAndUpdate(query, updateObj, { new: true });
  },



  updateDailyRewardHistoryById: async (query, updateObj) => {
    return await DailyRewardHistory.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateDailyRewardHistory: async (validatedBody) => {
    let query = {};
    const { search, fromDate, toDate, page, userId, limit, Status } =
      validatedBody;
    if (Status) {
      query.Status = Status
    }
    if (search) {
      const searchNumber = Number(search);
      const isNumber = !isNaN(searchNumber);
      query.$or = [];
      if (isNumber) {
        query.$or.push({ Reward_Amount: searchNumber });
      }
      let user = await User.findOne({userName: { $regex: search, $options: "i" }})
      query.$or.push({ userId: user._id });
    }
    
    if (userId) {
      query.userId = userId;
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
      ]
    };
    return await DailyRewardHistory.paginate(query, options);
  },
};



export { DailyClaimServices };
