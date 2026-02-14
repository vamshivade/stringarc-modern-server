import transactionModel from "../../../models/transaction";
import User from "../../../models/user";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose"
import { log } from "node:console";
const transactionServices = {
  createTransaction: async (insertObj) => {
    return await transactionModel.create(insertObj);
  },
  graphTransactionAggrigate: async (insertObj) => {
    return await transactionModel.aggregate(insertObj);
  },
  getTransaction: async (obj) => {
    return await transactionModel.findOne(obj).populate("userId");
  },
  transactionCount: async (obj) => {
    return await transactionModel.countDocuments(obj);
  },
  updateTransaction: async (query, updateObj) => {
    return await transactionModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  findTransactions: async (query) => {
    return await transactionModel.find(query);
  },

 
transactionPaginateSearch: async (validatedBody) => {
    const {
      search,
      fromDate,
      toDate,
      page,
      limit,
      transactionType,
      userId,
      status,
      notEqual,
      userName
    } = validatedBody;
  
    // Initialize filter object
    let filter = {};
  
    // Handle userName filter
    if (userName) {
      const user = await User.findOne({ userName: userName });
      if (user) {
        filter.userId = mongoose.Types.ObjectId(user._id);
      } else {
        // If user not found, you might want to handle it differently
        // For now, it will result in no matching transactions
        filter.userId = null;
      }
    }
  
    // Handle userId filter
    if (userId) {
      filter.userId = mongoose.Types.ObjectId(userId);
    }
  
    // Handle transactionType filter
    if (transactionType) {
      filter.transactionType = transactionType.toUpperCase(); // Assuming you want to handle different cases
    }else {
      filter.transactionType = "WITHDRAW"; // Include documents with transactionType field
    }
  
    // Handle notEqual status filter
    if (notEqual) {
      filter.status = { ...filter.status, $ne: notEqual };
    }
    if (search) {
      const user = await User.findOne({ userName:{ $regex: search, $options: "i" }} )
      filter.$or = [
        { walletAddress: { $regex: search, $options: "i" } },
        {userId:user._id}
      ];

    }
 
  
    // Handle status filter
    if (status) {
      filter.status = status;
    }
  
    // Handle date filters
    if (fromDate && !toDate) {
      filter.createdAt = { 
        ...filter.createdAt,
        $gte: new Date(new Date(fromDate).toISOString().slice(0, 10))
      };
    }
  
    if (!fromDate && toDate) {
      filter.createdAt = { 
        ...filter.createdAt,
        $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
      };
    }
  
    if (fromDate && toDate) {
      filter.createdAt = {
        $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)),
        $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
      };
    }
  
    // Build aggregation pipeline
    let agg = transactionModel.aggregate([
      { $match: filter },
      // Add other aggregation stages if needed
    ]);
  
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { createdAt: -1 }
    };
  
    const paginatedResult = await transactionModel.aggregatePaginate(agg, options);
  
    // Populate userId
    const populatedDocs = await transactionModel.populate(paginatedResult.docs, {
      path: 'userId',
      select: 'userName'  
    });
    paginatedResult.docs = populatedDocs;
  
    // Calculate total count using the same filter
    const totalCount = await transactionModel.countDocuments(filter);
    paginatedResult.total = totalCount;
  
    return paginatedResult;
},

  
  mostWithdraw:async(validatedBody)=>{
    const { search, fromDate, toDate, page, limit,status } = validatedBody;
     let matchStage = {$match:{transactionType:"WITHDRAW"}}
     if (status) {
      matchStage.$match.status = status;
    }
  if (fromDate && !toDate) {
    matchStage.$match.createdAt = {
      $gte: new Date(new Date(fromDate).toISOString().slice(0, 10)),
    };
  }
  if (!fromDate && toDate) {
    matchStage.$match.createdAt = {
      $lte: new Date(
        new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z"
      ),
    };
  }
  if (fromDate && toDate) {
    matchStage.$match.$and = [
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
  
    let pipeline=[
      matchStage,
      {
        $group: {
          _id: "$userId",
          totalDocuments: { $sum: 1 },
          userId: { $first: "$userId" },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {$sort:{totalDocuments:-1}}
    ]
    if (search) {
      pipeline.push({
          $match: { "user.email": { $regex: search, $options: 'i' } }
      });
  }
    let agg = transactionModel.aggregate(pipeline);
    let options = {
        page: Number(page) || 1,
        limit: Number(limit) ||10,
        sort: { createdAt: -1 }
    };
  
    return await transactionModel.aggregatePaginate(agg, options);
  
  }
};

module.exports = {
  transactionServices,
};
