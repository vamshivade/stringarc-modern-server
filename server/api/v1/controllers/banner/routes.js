import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()


  .get("/listBannerUser", controller.listBannerUser)
  .get("/viewBanner", controller.viewBanner)
  .use(auth.verifyToken)
  .delete("/deleteBanner", controller.deleteBanner)
  .put("/activeDeactiveBanner", controller.activeDeactiveBanner)

  .get("/listBanner", controller.listBanner)


  .use(upload.uploadFile)
  .put("/editBanner", controller.editBanner)
  .post("/addBanner", controller.addBanner)

