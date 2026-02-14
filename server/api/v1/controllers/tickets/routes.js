import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()
  .use(auth.verifyToken)

  
  //**************USER TICKET MANAGEMENT */
  .get("/viewTicketUser", controller.viewTicketUser)
  .get("/userGetTickets", controller.userGetTickets)
  .post("/buyTicket", controller.buyTicket)
  .post("/createWithdrawRequest", controller.createWithdrawRequest)
  .post("/withDrawTwoFactorAuth", controller.withDrawTwoFactorAuth)
  .get("/transactionListUser", controller.transactionListUser)

  //**************ADMIN TICKET MANAGEMENT */
  .get("/transactionHistory", controller.transactionHistory)
  .get("/viewTransactionHistory", controller.viewTransactionHistory)
  .get("/getTickets", controller.getTickets)
  .get("/viewTicket", controller.viewTicket)
  .post("/approveRejectWithdrawal", controller.approveRejectWithdrawal)
  .put("/blockTicket", controller.blockTicket)
  .delete("/deleteTicket", controller.deleteTicket)
  //---Withdraw Settings---//

 .get('/getwithdrawsettings', controller.getWithdrawSettings)
.post('/withdrawsettings', controller.WithdrawSetting)
  
  .post("/createTicket", controller.createTicket)
  .put("/updateTicket", controller.updateTicket)
  .use(upload.uploadFile)