
import categoryModel from "../../../models/category";
import statuss from '../../../enums/status';

const categoryServices = {

  createCategory: async (insertObj) => {
    return await categoryModel.create(insertObj);
  },

  findCategory: async (query) => {
    return await categoryModel.findOne(query);
  },

  categoryCheck: async (catId) => {
    let query = { $and: [{ status: { $ne: statuss.DELETE }, categoryTitle: catId }] };
    return await categoryModel.findOne(query);
  },

  updateCategory: async (query, updateObj) => {
    return await categoryModel.findOneAndUpdate(query, updateObj, { new: true });
  },

 

  updateCategoryById: async (query, updateObj) => {
    return await categoryModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateCategory: async (validatedBody) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { search, fromDate, toDate, page, limit,status } = validatedBody;
    if (search) {
      query.$or = [
        { categoryTitle: { $regex: search, $options: 'i' } },
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
    return await categoryModel.paginate(query, options);
  }

}

module.exports = { categoryServices };