
import gameHistoryModel from "../../../models/gameHistory";
import User from "../../../models/user";
import statuss from '../../../enums/status';
import mongoose from "mongoose"
const gameHistoryServices = {

  createGameHistory: async (insertObj) => {
    return await gameHistoryModel.create(insertObj);
  },

  findGameHistory: async (query) => {
    return await gameHistoryModel.findOne(query);
  },
  findAllGameHistory: async (query) => {
    return await gameHistoryModel.find(query).sort({ createdAt: -1 });
  },

  gameHistoryCount: async (query) => {
    return await gameHistoryModel.countDocuments(query);
  },
  updateGameHistory: async (query, updateObj) => {
    return await gameHistoryModel.findOneAndUpdate(query, updateObj, { new: true });
  },


  updateGameHistoryById: async (query, updateObj) => {
    return await gameHistoryModel.findByIdAndUpdate(query, updateObj, { new: true });
  },
  checkActiveGame: async (userId) => {
    return await gameHistoryModel.findOne({ userId: userId, gameStatus: "PLAYING" });
  },
  updateGameStatus: async (userId, gameId, gameStatus) => {
    try {

      // Update the game's status to the new status (e.g., "Expired")
      const updatedGame = await gameHistoryModel.updateOne(
        { gameId: gameId, userId: userId }, // Find the game by the active game's ID
        { $set: { gameStatus: gameStatus, updatedAt: Date.now() } }, { new: true }  // Update status and timestamp
      );
      console.log(updatedGame, "updatedGame");

      if (!updatedGame) {
        throw new Error("Failed to update game status. No game found or status not changed.");
      }
      return updatedGame;
    } catch (error) {
      console.error("Error updating game status:", error);
      throw new Error("Failed to update game status.");
    }
  },

  paginateGameHistory: async (validatedBody) => {

    const { search, fromDate, toDate, page, limit, status, playedStatus, gameId, userId,gameTitle } = validatedBody;
  
    let pipeline = [{
      $sort: { createdAt: -1 }
    }];
  
    if (status) {
      pipeline.push({ $match: { status: status } });
    }
    if (gameTitle) {
      pipeline.push({ $match: { gameTitle: gameTitle } });
    }
    if (playedStatus) {
      pipeline.push({ $match: { playedStatus: playedStatus } });
    }
    if (gameId) {
      pipeline.push({ $match: { gameId: gameId } });
    }
    if (userId) {
      pipeline.push({ $match: { userId: mongoose.Types.ObjectId(userId) } });
    }
    if (search) {
      let user = await User.findOne({
        userName: { $regex: validatedBody.search, $options: "i" }
      })
      
      if (user) {
        pipeline.push( {$match: {userId:user._id}})
      }else{
        pipeline.push({
          $match: {
            $or: [
              { gameTitle: { $regex: search, $options: 'i' } },
              { playedStatus: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }
    
       
      
    }
  
    if (fromDate && !toDate) {
      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(new Date(fromDate).toISOString().slice(0, 10))
          }
        }
      });
    }
  
    if (!fromDate && toDate) {
      pipeline.push({
        $match: {
          createdAt: {
            $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
          }
        }
      });
    }
  
    if (fromDate && toDate) {
      pipeline.push({
        $match: {
          $and: [
            {
              createdAt: {
                $gte: new Date(new Date(fromDate).toISOString().slice(0, 10))
              }
            },
            {
              createdAt: {
                $lte: new Date(new Date(toDate).toISOString().slice(0, 10) + "T23:59:59.999Z")
              }
            }
          ]
        }
      });
    }
  
    // Retrieve game history data with populated user data
    let agg = gameHistoryModel.aggregate(pipeline);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };
  
    // Execute aggregate pagination
    let result = await gameHistoryModel.aggregatePaginate(agg, options);
  
    // Populate the userId field with the user data
    result.docs = await gameHistoryModel.populate(result.docs, { path: 'userId', select: 'userName' });
  
    return result;
  },
  

  aggregateLeaderBoard: async (validatedBody) => {
    const { gameId, page, limit, fromDate, toDate, search } = validatedBody

    let matchStage = {
      $match: {
        playedStatus: "WON"
      }

    }
    if (gameId) {
      matchStage.$match.gameId = gameId;
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
    let pipeline = [
      matchStage,
      {
        $sort: { prize: -1 }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData"
        }
      },
      {
        $unwind: "$userData"
      },
      {
        $group: {
          _id: "$userId",
          highestLevel: { $first: "$level" },
          document: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$document" }
      }
    ];
    if (search) {
      pipeline.push({
        $match: {
          "userData.email": { $regex: search, $options: 'i' }
        }
      });
    }
    let data = gameHistoryModel.aggregate(pipeline)

    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      sort: { prize: -1, highestScore: -1 },
      select: '-otp -password -base64 -secretGoogle -emailotp2FA -withdrawOtp',
    };
    return await gameHistoryModel.aggregatePaginate(data, options);
  },

  paginateGameScore: async (validatedBody) => {
    const { gameId, page, limit, userId ,fromDate,toDate} = validatedBody
    let matchStage = {
      $match: { highestScore: { $exists: true } }
    };

    if (gameId) {
      matchStage.$match.gameId = gameId;
    }
    if (userId) {
      matchStage.$match.userId = mongoose.Types.ObjectId(userId);
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
    let pipeline = [
      matchStage,
      {
        $project: {
          userId: "$userId",
          score: "$highestScore",
          date: "$createdAt"
        }
      },
      {
        $sort: { level: -1 }
      },
    ];
    return await gameHistoryModel.aggregate(pipeline)
  },

  mostWon: async (validatedBody) => {
    const { search, fromDate, toDate, page, limit, } = validatedBody;
    let matchStage = { $match: { playedStatus: "WON" } }

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

    let pipeline = [
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
      { $sort: { totalDocuments: -1 } }
    ]
    if (search) {
      pipeline.push({
        $match: { "user.email": { $regex: search, $options: 'i' } }
      });
    }
    let agg = gameHistoryModel.aggregate(pipeline);
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    return await gameHistoryModel.aggregatePaginate(agg, options);

  }

}

module.exports = { gameHistoryServices };