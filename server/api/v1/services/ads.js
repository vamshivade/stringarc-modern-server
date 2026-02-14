import Ads from "../../../models/ads";
import status from "../../../enums/Taskstatus";

const AdsServices = {
  createAds: async (insertObj) => {
    return await Ads.create(insertObj);
  },

  findAds: async (query) => {
    return await Ads.findOne(query);
  },

  findAdsAll: async (query) => {
    return await Ads.find(query).sort({ createdAt: -1 });
  },
  findAdsById: async (AdId) => {
    return await Ads.findById(AdId).select('AdCount Rewardpoints');
  },

  searchAds: async (validatedBody) => {
    let query = {
      AdsTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await Ads.paginate(query, options);
  },

  AdsCount: async (query) => {
    return await Ads.countDocuments(query);
  },

  updateAds: async (query, updateObj) => {
    return await Ads.findOneAndUpdate(query, updateObj, { new: true });
  },

  AdsCheck: async (AdsTitle) => {
    let query = {
      $and: [{ status: { $ne: status.DELETE }, AdsTitle: AdsTitle }],
    };
    return await Ads.findOne(query);
  },

  updateAdsById: async (query, updateObj) => {
    return await Ads.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateAds: async (validatedBody) => {
    let query = {};
    const { search, fromDate, toDate, page, limit, status } =
      validatedBody;

    if (search) {
      query.$or = [
        { AdName: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } }
      ];
      
    }

    if (status) {
      query.Status = status;
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
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 }
    };
    return await Ads.paginate(query, options);
  },
};

export { AdsServices };
