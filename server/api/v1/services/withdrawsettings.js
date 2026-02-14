import WithdrawSetting from "../../../models/WithdrawalSettings";
import status from "../../../enums/Taskstatus";

const WithdrawSettingServices = {
  createWithdrawSetting: async (insertObj) => {
    return await WithdrawSetting.create(insertObj);
  },

  findWithdrawSetting: async (query) => {
    return await WithdrawSetting.findOne(query);
  },

  findWithdrawSettingAll: async (query) => {
    return await WithdrawSetting.find(query);
  },
  findWithdrawSettingById: async (query) => {
    return await WithdrawSetting.findById(query);
  },

  searchWithdrawSetting: async (validatedBody) => {
    let query = {
      WithdrawSettingTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await WithdrawSetting.paginate(query, options);
  },

  WithdrawSettingCount: async (query) => {
    return await WithdrawSetting.countDocuments(query);
  },

  updateWithdrawSetting: async (query, updateObj) => {
    return await WithdrawSetting.findOneAndUpdate(query, updateObj, { new: true });
  },



  updateWithdrawSettingById: async (query, updateObj) => {
    return await WithdrawSetting.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateWithdrawSetting: async (validatedBody) => {
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
    return await WithdrawSetting.paginate(query, options);
  },
};

export { WithdrawSettingServices };
