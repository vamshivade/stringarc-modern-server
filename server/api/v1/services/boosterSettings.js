import BoosterSetting from "../../../models/BoosterSettings";
import status from "../../../enums/Taskstatus";

const BoosterSettingServices = {
  createBoosterSetting: async (insertObj) => {
    return await BoosterSetting.create(insertObj);
  },

  findBoosterSetting: async (query) => {
    return await BoosterSetting.findOne(query);
  },

  findBoosterSettingAll: async (query) => {
    return await BoosterSetting.find(query);
  },
  findBoosterSettingById: async (query) => {
    return await BoosterSetting.findById(query);
  },

  searchBoosterSetting: async (validatedBody) => {
    let query = {
      BoosterSettingTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await BoosterSetting.paginate(query, options);
  },

  BoosterSettingCount: async (query) => {
    return await BoosterSetting.countDocuments(query);
  },

  updateBoosterSetting: async (query, updateObj) => {
    return await BoosterSetting.findOneAndUpdate(query, updateObj, { new: true });
  },



  updateBoosterSettingById: async (query, updateObj) => {
    return await BoosterSetting.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateBoosterSetting: async (validatedBody) => {
    let query = {};
    const { fromDate, toDate, page, limit, status } =validatedBody;

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
    return await BoosterSetting.paginate(query, options);
  },
};

export { BoosterSettingServices };
