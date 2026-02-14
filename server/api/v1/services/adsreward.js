
import User from "../../../models/user";
import AdsRewardHistory from "../../../models/AdsRewardhistorymodel"

const adsRewardServices = {
  createAdReward: async (insertObj) => {
    return await AdsRewardHistory.create(insertObj);
  },

  AdsRewards: async (query) => {
    return await AdsRewardHistory.find(query);
  },

  AdsRewardFind: async (query, options) => {
    return await AdsRewardHistory.findOne(query, options).sort({
      createdAt: -1,
    });
  },
  getTodayAdsRewardsByAdId: async (adId, userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Start of the next day

    return AdsRewardHistory.find({
      AdId: adId,
      user_id: userId,
      createdAt: { $gte: today, $lt: tomorrow }, // Filter for today's rewards
    });
  },
  paginateAdsrewardHistory: async (validatedBody) => {
    let query = {};
    const { fromDate, search, toDate, page, limit, userId } = validatedBody;
    if (search) {
      const user = await User.findOne({ userName: validatedBody.search });

      if (user) {
        query.user_id = user._id;
      }
    }

    if (userId) {
      query.user_id = userId;
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
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 },
      populate: [{ path: "user_id", select: "userName" }],
      // Include populate here
    };
    return await AdsRewardHistory.paginate(query, options);
  },
};
export { adsRewardServices };