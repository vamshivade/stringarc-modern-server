import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()

  .get("/listCategory", controller.listCategory)
  .get("/viewCategory", controller.viewCategory)

  .use(auth.verifyToken)
  .delete("/deleteCategory", controller.deleteCategory)
  .put("/activeDeactiveCategory", controller.activeDeactiveCategory)
  .get("/adminListCategory", controller.adminListCategory)

  .use(upload.uploadFile)
  .put("/editCategory", controller.editCategory)
  .post("/addCategory", controller.addCategory)
  
