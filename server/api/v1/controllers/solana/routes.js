import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";

export default Express.Router()
  .post("/getSolanaBalance", controller.getSolanaBalance)
  .use(auth.verifyToken)
  .post("/solanaInUSDT", controller.solanaInUSDT)
  .post("/connectWallet", controller.connectWallet)
   

  
