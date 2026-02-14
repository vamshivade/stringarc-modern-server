
import bannerModel from "../../../models/banner";
import statuss from '../../../enums/status';

const bannerServices = {

  createBanner: async (insertObj) => {
    return await bannerModel.create(insertObj);
  },

  findBanner: async (query) => {
    return await bannerModel.findOne(query);
  },
  findBanners: async (query) => {
    return await bannerModel.find(query);
  },

  bannerCheck: async (userId) => {
    let query = { $and: [{ status: { $ne: statuss.DELETE }, categoryTitle: userId }] };
    return await bannerModel.findOne(query);
  },

  updateBanner: async (query, updateObj) => {
    return await bannerModel.findOneAndUpdate(query, updateObj, { new: true });
  },

 

  updateBannerById: async (query, updateObj) => {
    return await bannerModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateBanner: async (validatedBody) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { search, fromDate, toDate, page, limit,status } = validatedBody;
    if (search) {
      query.$or = [
        { bannerURL: { $regex: search, $options: 'i' } },
      ]
    }
    if (fromDate && !toDate) {
      query.createdAt = { $gte: fromDate };
    }
    if (status) {
      query.status = status;
    }
    if (!fromDate && toDate) {
      query.createdAt = { $lte: toDate };
    }
    if (fromDate && toDate) {
      query.$and = [
        { createdAt: { $gte: fromDate } },
        { createdAt: { $lte: toDate } },
      ]
    }
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 }
    };
    return await bannerModel.paginate(query, options);
  }

}

module.exports = { bannerServices };