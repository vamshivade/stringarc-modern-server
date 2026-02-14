import gameModel from "../../../models/game";
import statuss from "../../../enums/status";

const gameServices = {
  createGame: async (insertObj) => {
    return await gameModel.create(insertObj);
  },

  findGame: async (query) => {
    return await gameModel.findOne(query);
  },

  findGameAll: async (query) => {
    return await gameModel.find(query);
  },

  searchGames: async (validatedBody) => {
    let query = {
      gameTitle: { $regex: validatedBody.search, $options: "i" },
      status: statuss.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await gameModel.paginate(query, options);
  },

  gameCount: async (query) => {
    return await gameModel.countDocuments(query);
  },

  updateGame: async (query, updateObj) => {
    return await gameModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  gameCheck: async (gameTitle) => {
    let query = {
      $and: [{ status: { $ne: statuss.DELETE }, gameTitle: gameTitle }],
    };
    return await gameModel.findOne(query);
  },

  updateGameById: async (query, updateObj) => {
    return await gameModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateGame: async (validatedBody) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { search, fromDate, toDate, page, limit, status, category, latest } =
      validatedBody;

    if (search) {
      query.$or = [{ gameTitle: { $regex: search, $options: "i" } }];
    }

    if (status) {
      query.status = status;
    }
    if (latest) {
      query.latest = latest;
    }
    if (category) {
      query.category = category;
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
    return await gameModel.paginate(query, options);
  },
};

export { gameServices };
