import Dailyrewards from "../../../models/DailyRewardPlan";
import status from "../../../enums/Taskstatus";

const DailyrewardServices = {
  createDailyRewards: async (insertObj) => {
    return await Dailyrewards.create(insertObj);
  },

  findDailyRewards: async (query) => {
    return await Dailyrewards.findOne(query);
  },

  findDailyRewardsAll: async (query) => {
    return await Dailyrewards.find(query);
  },

  searchDailyRewards: async (validatedBody) => {
    let query = {
      DailyRewardsTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await Dailyrewards.paginate(query, options);
  },

  DailyRewardsCount: async (query) => {
    return await Dailyrewards.countDocuments(query);
  },

  updateDailyRewards: async (query, updateObj) => {
    return await Dailyrewards.findOneAndUpdate(query, updateObj, { new: true });
  },

  DailyRewardsCheck: async (DailyRewardsTitle) => {
    let query = {
      $and: [{ status: { $ne: status.DELETE }, DailyRewardsTitle: DailyRewardsTitle }],
    };
    return await Dailyrewards.findOne(query);
  },

  updateDailyRewardsById: async (query, updateObj) => {
    return await Dailyrewards.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateDailyRewards: async (validatedBody) => { 
    let query = {};
    const { search, fromDate, toDate, page, limit} =
      validatedBody;

    if (search) {
      query.$or = [{Reward_Amount : { $regex: search, $options: "i" } },
        
      ];
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
    return await Dailyrewards.paginate(query, options);
  },
};

export { DailyrewardServices };
