import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import Joi from "joi";

import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";

import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";
const { findUser } = userServices;

import { taskServices } from "../../services/tasks";
import { usertaskServices } from "../../services/usertasks";

export class taskController {
  async Addtasks(req, res, next) {


    const validationSchema = {
      TaskName: Joi.string().optional(),
      _id: Joi.string().optional(),
      Subtask: Joi.string().optional(),
      Description: Joi.string().optional(),
      Sitelink: Joi.string().optional(),
      Siteimg: Joi.string().optional(),
      TaskImage: Joi.string().optional(),
      Rewardpoints: Joi.number().optional(),
      Status: Joi.string().optional()


    };
    try {

      const validatedBody = await Joi.validate(req.body, validationSchema);


      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (req.body._id) {
        var result = await taskServices.updateTaskById({ _id: validatedBody._id }, validatedBody,);
        if (!result) {
          throw apiError.notFound(responseMessage.EDIT_TASK_FAILED);
        }
      } else {
        var result = await taskServices.createTask(validatedBody);
        if (!result) {
          throw apiError.notFound(responseMessage.ADD_TASK_FAILED);
        }

      }
      return res.json(new response(result, responseMessage.ADD_TASK));
    } catch (error) {
      return next(error);
    }
  }

  async Gettasks(req, res, next) {
    try {
      const tasks = await taskServices.findTaskAll();


      if (!tasks) {
        throw apiError.notFound(responseMessage.TASK_NOT_FOUND);
      }
      return res.json(new response(tasks, responseMessage.TASK_FOUND))

    }
    catch (error) {
      return next(error);
    }
  }


  async getUserTasks(req, res) {

    try {
      let userResult = await findUser({
        _id: req.userId
      });

      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const CompletedTasks = await usertaskServices.findUserTask({
        user_id: req.userId,
        Status: "COMPLETED",
      });
      const Tasks = await taskServices.findTaskAll({ Status: "ACTIVE" });

      if (!Tasks) {
        throw apiError.notFound(responseMessage.TASK_NOT_FOUND);
      }
      const userTasksStatus = Tasks.map((dailyTask) => {
        const userTask = CompletedTasks.find(
          (userTask) => userTask.TaskId.toString() === dailyTask._id.toString()
        );
        const isTaskCompleted = !!userTask;

        return {
          TaskId: dailyTask._id,
          TaskName: dailyTask.TaskName,
          TaskStatus: dailyTask.Status,
          Subtask: dailyTask.Subtask,
          Description: dailyTask.Description,
          Sitelink: dailyTask.Sitelink,
          Siteimg: dailyTask.Siteimg,
          TaskImage: dailyTask.TaskImage,
          Rewardpoints: dailyTask.Rewardpoints,
          Status: isTaskCompleted ? userTask.Status : "PENDING",
        };
      });
      return res.json(
        new response(userTasksStatus, responseMessage.GET_TASKS_SUCCESS)
      )
    } catch (error) {
      return next(error);
    }
  }

  async Taskstatus(req, res, next) {
    const validationSchema = {
      TaskId: Joi.string().required(),
      Rewardpoints: Joi.number().required(),
    };
    try {
      // Validate the request body asynchronously
      const validatedBody = await Joi.validate(req.body, validationSchema);

      // Find the user based on the criteria
      const user = await findUser({
        _id: req.userId,
      });

      if (!user) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const ActivetaskIdexist = await taskServices.findTask({ _id: validatedBody.TaskId, Status: "ACTIVE" });
      if (!ActivetaskIdexist) {
        throw apiError.notFound("Invalid task");
      }
      if(parseFloat(validatedBody.Rewardpoints)!==parseFloat(ActivetaskIdexist.Rewardpoints)){
        throw apiError.conflict("Invalid task Reward");
      }
      const taskexists = await usertaskServices.findUserTask({
        user_id: user._id,
        TaskId: validatedBody.TaskId
      })

      if (taskexists.length>0) {
        throw apiError.notFound("You have already claimed your task reward");
      }

      const UserTaskupdate = await usertaskServices.createUserTask({
        user_id: user._id,
        TaskId: validatedBody.TaskId,
        Status: "COMPLETED",
        Rewardpoints: validatedBody.Rewardpoints,
        InitialBalance: parseFloat(user.ticketBalance),
        FinalBalance: parseFloat(validatedBody.Rewardpoints + user.ticketBalance)
      });
      if (!UserTaskupdate) {
        throw apiError.notFound("Unable Create User Task");
      }
      const updatedUserbal = await userServices.updateUserticketBalance(
        { _id: req.userId },
        { ticketBalance: parseFloat(validatedBody.Rewardpoints + user.ticketBalance) }
      );
      if (!updatedUserbal) {

        throw apiError.notFound("Unable Update User Ticket Balance");
      }
      return res.json(
        new response(UserTaskupdate, responseMessage.USERTASK_CREATED_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  };

}

export default new taskController();
