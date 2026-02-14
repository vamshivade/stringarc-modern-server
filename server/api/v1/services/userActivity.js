import userActivityModel from "../../../models/userActivity";
import status from "../../../enums/status";
import userType from "../../../enums/userType";

const userActivityServices = {

  createUserActivity: async (insertObj) => {
    return await userActivityModel.create(insertObj);
  },

  userActivityCount: async (query) => {
    return await userActivityModel.countDocuments(query);
  },
  findUserActivity: async (query) => {
    return await userActivityModel.findOne(query).select("-otp");
  },

  findUserActivityData: async (query) => {
    return await userActivityModel.find(query);
  },

  paginateSearchActivity: async (validatedBody) => {
    let query = {
      status: { $ne: status.DELETE },
      userType: { $ne: userType.ADMIN },
    };
    const { search, fromDate, toDate, page, limit, userId,type } =
      validatedBody;
      
    if (search) {
      query.$or = [
       { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];

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
     select: '-otp -password -base64 -secretGoogle -emailotp2FA -withdrawOtp'
    }
    return await userActivityModel.paginate(query, options);
  },
};

module.exports = { userActivityServices };
