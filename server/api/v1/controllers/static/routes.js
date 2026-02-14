import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()

  .get("/viewStaticContent", controller.viewStaticContent)
  .get("/staticContentList", controller.staticContentList)
  .get("/viewFAQ/:_id", controller.viewFAQ)
  .get("/faqList", controller.faqList)
  
  .use(auth.verifyToken)
  .put("/editStaticContent", controller.editStaticContent)
  .post("/addStaticContent", controller.addStaticContent)
  .post("/addFAQ", controller.addFAQ)
  .put("/editFAQ", controller.editFAQ)
  .delete("/deleteFAQ", controller.deleteFAQ);
