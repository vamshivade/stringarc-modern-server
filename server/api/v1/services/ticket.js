import ticketModel from "../../../models/tickets";


import statuss, { ACTIVE } from "../../../enums/status"
const ticketServices = {

    createTicket: async (insertObj) => {
        return await ticketModel.create(insertObj);
    },

    findTicket: async (query) => {
        return await ticketModel.findOne(query).populate('gameId');
    },
    ticketCount: async () => {
      return await ticketModel.countDocuments({});
    },

    updateTicket: async (query, updateObj) => {
        return await ticketModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    ticketList: async (query) => {
        return await ticketModel.find(query);
    },
    paginateTicket: async (validatedBody) => {
        let query = { status: { $ne: statuss.DELETE } };
        const { search, fromDate, toDate, page, limit,status } = validatedBody;
        if (search) {
          query.gameId=search
        }
    
        if(status){
          query.status=status
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
          ]
        }
        let options = {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          sort: { createdAt: -1 },
          populate: "gameId",
        };
        return await ticketModel.paginate(query, options);
      }

}

module.exports = { ticketServices };