import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()
  .get("/userGameList", controller.userGameList)
  .get("/searchGame", controller.searchGame)
  .get("/userGameListAll", controller.userGameListAll)
  .get("/userViewGame", controller.userViewGame)
  .use(auth.verifyToken)
  .delete("/deleteGame", controller.deleteGame)
  .get("/viewGame", controller.viewGame)

  .put("/activeDeactiveGame", controller.activeDeactiveGame)
  .get("/listGame", controller.listGame)
  .get("/listGameAll", controller.listGameAll)


  .use(upload.uploadFile)
  .put("/editGame", controller.editGame)
  .post("/addGame", controller.addGame);