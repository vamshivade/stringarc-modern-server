import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()

  .use(auth.verifyToken)
  .post("/addrewards", controller.AddReward)
  .put("/editrewards", controller.AddReward)
  .get("/getrewards", controller.GetRewards)
  
  
  .get("/getrewardplan", controller.getAllRewardPlan)
  .post("/addclaim", controller.Addclaim)