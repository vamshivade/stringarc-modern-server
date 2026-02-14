import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';



export default Express.Router()


    .post('/signUp',auth.verifyInitData, controller.signup)
    .patch('/verifyOTPSignUp', controller.verifyOTPSignUp)
    .patch('/verifyOTP', controller.verifyOTP)
    .post('/login',auth.verifyInitData,  controller.login)
    .post('/swlogin',
       auth.verifyInitData,
       controller.login)
    .post('/verify2Falogin', controller.verify2Falogin)
    .post('/forgotPassword', controller.forgotPassword)
    .post('/resendOtp', controller.resendOtp)
    .post('/socialLogin', controller.socialLogin)
    .post('/checkUserName', controller.checkUserName)
    .post('/contactUs', controller.contactUs)
    
    .post('/resetPassword', controller.resetPassword)
    .get('/getLatestBet', controller.getLatestBet)
    .get('/getLeaderBoard', controller.getLeaderBoard)
    .use(auth.verifyToken)

    .post('/getContactUs', controller.getContactUs)
    .post('/playGame', controller.playGame)
    .post('/createGameHistory', controller.createGameHistory)
    .get('/viewContactsUs', controller.viewContactsUs)
    .get('/getGameHistory', controller.getGameHistory)
    .get('/graphGameScore', controller.graphGameScore)
    .get('/graphGameHistoryUser', controller.graphGameHistoryUser)
    .post('/enableTwoFactorGoogle', controller.enableTwoFactorGoogle)
    .post('/verifyTwoFactorGoogle', controller.verifyTwoFactorGoogle)
    .get('/graphDWUser', controller.graphDWUser)
    .patch('/changePassword', controller.changePassword)
    .get('/getProfile', controller.getProfile)
    .get('/viewUser', controller.viewUser)

    .post('/editEmail2FA', controller.editEmail2FA)
    .get('/userReferredList', controller.userReferredList)
    .put('/isChange', controller.isChange)
    .put('/editSound', controller.editSound)
    .put('/verify2FAOTP', controller.verify2FAOTP)
    .use(upload.uploadFile)
    .post('/uploadFile', controller.uploadFile)
    .put('/editProfile', controller.editProfile)
    .get('/getgamestatus', controller.getGamesByStatus)