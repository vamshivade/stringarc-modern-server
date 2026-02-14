import BoosterTransaction from "../../../models/BoosterTransaction";
import User from "../../../models/user";
import Booster from "../../../models/Booster";
import status from "../../../enums/Taskstatus";

const BoosterTransactionServices = {
  createBoosterTransaction: async (insertObj) => {
    return await BoosterTransaction.create(insertObj);
  },

  findBoosterTransaction: async (query) => {
    return await BoosterTransaction.findOne(query);
  },

  findBoosterTransactionAll: async (query) => {
    return await BoosterTransaction.find(query);
  },
  findBoosterTransactionById: async (query) => {
    return await BoosterTransaction.findById(query);
  },

  // searchBoosterTransaction: async (validatedBody) => {
  //   let query = {
  //     $or: [
  //       {
  //         userName: { $regex: validatedBody.search, $options: "i" },
  //       },
  //       {
  //         Name: { $regex: validatedBody.search, $options: "i" },
  //       },
  //     ],

  //     status: status.ACTIVE,
  //   };
  //   let options = {
  //     page: Number(validatedBody.page) ,
  //     limit: Number(validatedBody.limit) 0,
  //   };
  //   return await BoosterTransaction.paginate(query, options);
  // },


  searchBoosterTransaction: async (validatedBody) => {
    // Step 1: Query the user and booster collections to get the IDs
    let userId = null;
    let boosterId = null;

    if (validatedBody.search) {
      // Search for the userId based on the userName
      const user = await User.findOne({ userName: { $regex: validatedBody.search, $options: "i" } });

      // Search for the boosterId based on the boosterName
      const booster = await Booster.findOne({ Name: { $regex: validatedBody.search, $options: "i" } });

      // If user is found, get the userId
      if (user) {
        userId = user._id;
      }

      // If booster is found, get the boosterId
      if (booster) {
        boosterId = booster._id;
      }
    }

    // Step 2: Build the query for BoosterTransaction
    let query = {
      $or: [
        { userId },  // If userId is found, search by userId
        { boosterId }, // If boosterId is found, search by boosterId
      ]
    };

    // Step 3: Set pagination options
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
      sort: { createdAt: -1 },
      populate: { path: 'User_Id', select: 'username' } // Include populate here
    };
    return await BoosterTransaction.paginate(query, options);
  },

  BoosterTransactionCount: async (query) => {
    return await BoosterTransaction.countDocuments(query);
  },

  updateBoosterTransaction: async (query, updateObj) => {
    return await BoosterTransaction.findOneAndUpdate(query, updateObj, { new: true });
  },


  updateBoosterStatus: async (transactionId, status) => {
    const transaction = await BoosterTransaction.findByIdAndUpdate(
      transactionId, { Status: status }, { new: true }
    );
    return transaction;

  },

  updateBoosterTransactionById: async (query, updateObj) => {
    return await BoosterTransaction.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateBoosterTransaction: async (validatedBody) => {
    let query = {};
    const { fromDate, search, toDate, page, limit, userId, status } = validatedBody;

    if (status) {
      query.Status = status;
    }
    if (search) {
      let userId = null;
      let boosterId = null;
      const user = await User.findOne({ userName: { $regex: validatedBody.search, $options: "i" } });
      const booster = await Booster.findOne({ Name: { $regex: validatedBody.search, $options: "i" } });
      if (user) {
        userId = user._id;
      }

      if (booster) {
        boosterId = booster._id;
      }
      query = {
        $or: [
          { User_Id: userId },
          { Booster_Id: boosterId },
          { Status: search }
        ]
      }
     
    }

    if (userId) {
      query.User_Id = userId
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
      sort: { createdAt: -1 },
      populate: [
        { path: 'User_Id', select: 'userName' },
        { path: 'Booster_Id' }
      ]
      // Include populate here
    };
    return await BoosterTransaction.paginate(query, options);
  }
};

export { BoosterTransactionServices };
