import userModel from "../../../models/blockedUserName";
import status from "../../../enums/status";
import userType from "../../../enums/userType";

const blockedUserServices = {
 
  blockUserName: async (insertObj) => {
    return await userModel.create(insertObj);
  },

  findBlockedUserName: async (query) => {
    return await userModel.findOne(query).select("-otp");
  },
  
  

 

  findBlockedUserNameData: async (query) => {
    return await userModel.findOne(query);
  },

  deleteBlockedUserName: async (query) => {
    return await userModel.deleteMany({});
  },

  blockedUserNameList: async (query) => {
    return await userModel.find(query);
  },

  updateBlockedUserName: async (query, updateObj) => {
    return await userModel
      .findOneAndUpdate(query, updateObj, { new: true })
      .select("-otp");
  },

  updateBlockedUserNameById: async (query, updateObj) => {
    return await userModel
      .findOneAndUpdate(query, updateObj, { upsert: true, new: true })
  },


  paginateBlockedUserNameSearch: async (validatedBody) => {
    let query = {
      status: { $ne: status.DELETE },
      userType: { $ne: userType.ADMIN },
    };
    const { search, fromDate, toDate, page, limit, userType1, status1 } =
      validatedBody;
      
     
      if (search) {
        query.$or = [
          { 'userName.userName': { $regex: search, $options: "i" } },
          { 'email.email': { $regex: search, $options: "i" } }
        ];
      }
    if (status1) {
      query.status = status1;
    }
    if (userType1) {
      query.userType = userType1;
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
    return await userModel.paginate(query, options);
  },
};

module.exports = { blockedUserServices };
