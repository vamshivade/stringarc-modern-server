import TaskModel from "../../../models/Tasks";
import status from "../../../enums/Taskstatus";

const taskServices = {
  createTask: async (insertObj) => {
    return await TaskModel.create(insertObj);
  },

  findTask: async (query) => {
    return await TaskModel.findOne(query);
  },

  findTaskAll: async (query) => {
    return await TaskModel.find(query);
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
    return await TaskModel.paginate(query, options);
  },

  taskCount: async (query) => {
    return await TaskModel.countDocuments(query);
  },

  updateTask: async (query, updateObj) => {
    return await TaskModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  taskCheck: async (TaskTitle) => {
    let query = {
      $and: [{ status: { $ne: status.DELETE }, TaskTitle: TaskTitle }],
    };
    return await TaskModel.findOne(query);
  },

  updateTaskById: async (query, updateObj) => {
    return await TaskModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateTask: async (validatedBody) => {
    let query = {  };
    const { search, fromDate, toDate, page, limit, status} =
      validatedBody;

    if (search) {
      query.$or = [{ TaskName: { $regex: search, $options: "i" } }];
    }

    if (status) {
      query.Status = status;
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
    return await TaskModel.paginate(query, options);
  },
};

export { taskServices };
