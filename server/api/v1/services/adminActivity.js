import adminActivityModel from "../../../models/adminActivity";
import status from "../../../enums/status";
import userType from "../../../enums/userType";

const adminActivityServices = {

  createAdminActivity: async (insertObj) => {
    return await adminActivityModel.create(insertObj);
  },

  adminActivityCount: async (query) => {
    return await adminActivityModel.countDocuments(query);
  },
  findAdminActivity: async (query) => {
    return await adminActivityModel.findOne(query).select("-otp");
  },

  findAdminActivityData: async (query) => {
    return await adminActivityModel.findOne(query);
  },

  paginateSearchActivityAdmin: async (validatedBody) => {
    let query = {
      status: { $ne: status.DELETE },
      userType: { $ne: userType.ADMIN },
    };
    const { adminId, fromDate, toDate, page, limit, userId,type } =
      validatedBody;
      
    if (adminId) {
      query.adminId =adminId

    }
    if (userId) {
      query.userId = userId;
    }
    if (type) {
      query.type = type;
    }
    if (fromDate && !toDate) {
      query.createdAt = {
        $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)),
      };
    }
    if (!fromDate && toDate) {
      query.createdAt = {
        $lte: new Date(
          new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z"
        ),
      };
    }
    if (fromDate && toDate) {
      query.$and = [
        {
          createdAt: {
            $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)),
          },
        },
        {
          createdAt: {
            $lte: new Date(
              new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z"
            ),
          },
        },
      ];
    }
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 }, 
      populate: [
        { path: 'userId' },
        { path: 'adminId' }
      ],
     select: '-otp -password -base64 -secretGoogle -emailotp2FA -withdrawOtp'
    }
    return await adminActivityModel.paginate(query, options);
  },
};

module.exports = { adminActivityServices };
