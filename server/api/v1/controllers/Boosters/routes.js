import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";


export default Express.Router()


.use(auth.verifyToken)
.post("/addBoosters", controller.AddBoosters)
.put("/editBoosters", controller.AddBoosters)
.get("/getBoosters", controller.GetBoosters)
.get("/getUserBoosters", controller.GetUserBoosters)
.post("/createBoostersetting", controller.Boostersetting)
.get("/getBoostersetting", controller.GetBoosterSettings)


//user routes
.get("/userboosters", controller.getuserboosters)
.get("/userboostersbyId/:id", controller.getuserboosters)
.get("/boosterdata", controller.getboosters)
.post("/transferurls", controller.GenerateSolTransferUrl)
.post("/boosterstatus", controller.Boosterstatus)



 


