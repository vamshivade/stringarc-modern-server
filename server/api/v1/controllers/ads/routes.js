import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()

  .use(auth.verifyToken)
  .post("/addAds", controller.AddAds)
  .put("/editAds", controller.AddAds)
  .get("/getAds", controller.GetAds)
  
  .post("/Adsreward", controller.AdRewards)
  .get("/adsEndTime", controller.GetAdsEndTime);
