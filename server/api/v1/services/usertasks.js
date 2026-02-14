import Usertaskmodel from "../../../models/usertasks";
import taskmodel from "../../../models/Tasks";
import User from "../../../models/user";
import status from "../../../enums/Taskstatus";

const usertaskServices = {
  
  createUserTask: async (taskData) => {
    return await Usertaskmodel.create(taskData);
  },

  findTask: async (query) => {
    return await Usertaskmodel.findOne(query);
  },

  findUserTask: async (query) => {
    return await Usertaskmodel.find(query);
  },
  findOne: async (query) => {
    return await Usertaskmodel.find(query);
  },

  searchTasks: async (validatedBody) => {
    let query = {
      TaskTitle: { $regex: validatedBody.search, $options: "i" },
      status: status.ACTIVE,
    };
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await Usertaskmodel.paginate(query, options);
  },

  taskCount: async (query) => {
    return await Usertaskmodel.countDocuments(query);
  },

  updateTask: async (query, updateObj) => {
    return await Usertaskmodel.findOneAndUpdate(query, updateObj, { new: true });
  },

  taskCheck: async (TaskTitle) => {
    let query = {
      $and: [{ status: { $ne: status.DELETE }, TaskTitle: TaskTitle }],
    };
    return await Usertaskmodel.findOne(query);
  },

  updateTaskById: async (query, updateObj) => {
    return await Usertaskmodel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateuserTask: async (validatedBody) => {
    let query = {};
    const { fromDate, search, toDate, page,userId,limit} = validatedBody;
    if (search) {

      const task = await taskmodel.findOne({ TaskName:  validatedBody.search });
      const user = await taskmodel.findOne({ userName:  validatedBody.search });

      if (task) {
        query.TaskId = task._id;
      }
      if (user) {
        query.user_id = user._id;
      }
     

    }
    if (userId) {
      query.user_id = userId;
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
        { path: 'user_id', select: 'userName' },
      ]
       // Include populate here
    };
    return await Usertaskmodel.paginate(query, options);
  }


  // paginateuserTask: async (validatedBody) => {
   
  //   const { search, fromDate, toDate, page, limit, status } =
  //     validatedBody;

  //   if (search) {
  //     query.$or = [{ TaskTitle: { $regex: search, $options: "i" } }];
  //   }

  //   if (status) {
  //     query.status = status;
  //   }
  //   if (latest) {
  //     query.latest = latest;
  //   }
  //   if (category) {
  //     query.category = category;
  //   }
  //   if (fromDate && !toDate) {
  //     query.createdAt = { $gte: fromDate };
  //   }
  //   if (!fromDate && toDate) {
  //     query.createdAt = { $lte: toDate };
  //   }
  //   if (fromDate && toDate) {
  //     query.$and = [
  //       { createdAt: { $gte: fromDate } },
  //       { createdAt: { $lte: toDate } },
  //     ];
  //   }
  //   let options = {
  //     page: Number(page) || 1,
  //     limit: Number(limit) || 10,
  //   };
  //   return await Usertaskmodel.paginate(query, options);
  // },
};

export { usertaskServices };
