import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()

  .use(auth.verifyToken)
  .post("/addTask", controller.Addtasks)
  .put("/editTask", controller.Addtasks)
  .get("/getTask", controller.Gettasks)
  
  .get("/getuserTask", controller.getUserTasks)
  .post("/taskstatus", controller.Taskstatus)
  
  
