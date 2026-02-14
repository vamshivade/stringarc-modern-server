import userModel from "../../../models/user";
import status from "../../../enums/status";
import userType from "../../../enums/userType";
import boosterTransaction from "../../../models/BoosterTransaction";
import apiError from "../../../helper/apiError";

const userServices = {
  updateUserAdRewardTimes: async (userId, adsRewardEndtime, adsRewardEndtime2) => {
    return await userModel.findOneAndUpdate(
      { _id: userId },
      { adsRewardEndtime, adsRewardEndtime2 },
      { new: true }
    )},

  updateUserticketBalance: async (query, updateObj) => {
    return await userModel.findOneAndUpdate(query, updateObj , { new: true });
  },
  userCheck: async (userId) => {
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { $or: [{ email: userId }, { mobileNumber: userId }] },
      ],
    };
    return await userModel.findOne(query);
  },

  checkUserExists: async ( email) => {
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { $or: [{ email: email }] },
      ],
    };
    return await userModel.findOne(query);
  },

  emailExist: async ( userName, id) => {
   
    let query = {
      $and: [
        { status: { $ne: status.DELETE } },
        { _id: { $ne: id } },
        {  userName: userName  },
      ],
    };
    return await userModel.findOne(query);
  },

  checkSocialLogin: async (socialId, socialType) => {
    return await userModel.findOne({
      socialId: socialId,
      socialType: socialType,
    });
  },

  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },

  findUser: async (query) => {
    return await userModel.findOne(query).populate([
      { path: 'referrerId' },
      { path: 'referredPeople' }
    ]);
  },

  userCount: async () => {
    return await userModel.countDocuments({
      userType: {$ne: userType.ADMIN} ,
      status:{$ne:status.DELETE}
    })
  },

  userCountGraph: async (query) => {
    return await userModel.countDocuments(query);
  },
  findUserData: async (query) => {
    return await userModel.findOne(query);
  },

  deleteUser: async (query) => {
    return await userModel.deleteOne(query);
  },

  userFindList: async () => {
    return await userModel.find( {userType: {$ne: userType.ADMIN}});
  },
  userList: async (query, projection, options) => {
    return await userModel.find(query, projection, options);
  },

  updateUser: async (query, updateObj) => {
    return await userModel
      .findOneAndUpdate(query, updateObj, { new: true })
      .select("-otp");
  },
  updateAll: async (query, updateObj) => {
    return await userModel
      .updateMany(query, updateObj, { new: true })
      .select("-otp");
  },

  updateUserById: async (query, updateObj) => {
    return await userModel
      .findByIdAndUpdate(query, updateObj, { new: true })
      .select("-otp");
  },
  multiUpdateLockedBal: async () => {
    return await userModel.updateMany({}, {$set:{lockedBalance:0}}, { multi: true });
},
  insertManyUser: async (obj) => {
    return await userModel.insertMany(obj);
  },

  paginateSearch: async (validatedBody) => {
    let query = {
      status: { $ne: status.DELETE },
      userType: { $ne: userType.ADMIN },
    };
    const { search, fromDate,referrerId,otpVerified, toDate, page, limit, userType1, status1 } =
      validatedBody;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
         
      ];
    }
    if (status1) {
      query.status = status1;
    }
    if (otpVerified) {
      query.otpVerified = otpVerified;
    }
    if (referrerId) {
      query.referrerId = referrerId;
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



  getUserBoosterEndTime: async (userId) => {
    const user = await userModel.findById(userId).select('BoosterEndTime');
    return user;
  },
  updateUserBoosterEndTime: async(userId, BoosterEndTime)=> {
      const user = await userModel.findByIdAndUpdate(
        userId,{ BoosterEndTime }, { new: true }
      );
      return user;
  
  }

};

module.exports = { userServices };
