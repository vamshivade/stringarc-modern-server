import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import Rewardstatus from "../../../../enums/Taskstatus";
import Joi from "joi";

import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";

import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";
const {findUser} = userServices;

import { DailyrewardServices } from "../../services/dailyrewards";
import { DailyClaimServices } from "../../services/dailyclaim";

export class DailyrewardController {
  async AddReward(req, res,next)  {
    
    
    const validationSchema = {
      Reward_Amount: Joi.number().required(),
      _id: Joi.string().optional(),
     
      
    };
    try {

      const validatedBody = await Joi.validate(req.body,validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
    if (req.body._id) {
      const rewarddata = await DailyrewardServices.findDailyRewards({_id:req.body._id,Status:Rewardstatus.ACTIVE})
      if(rewarddata){
        
        
        const updaterewarddata = await DailyrewardServices.updateDailyRewardsById({_id:req.body._id},{Status:Rewardstatus.INACTIVE},{new:true});
        if(!updaterewarddata){
          throw apiError.notFound(responseMessage.EDIT_REWARDS_FAILED)
        }
      
      var result = await DailyrewardServices.createDailyRewards({Reward_Amount:req.body.Reward_Amount,Addedby:req.userId,Status:Rewardstatus.ACTIVE});
      if (!result) {
        throw apiError.notFound(responseMessage.EDIT_REWARDS_FAILED);
      }
    }
    }else{
      var result = await DailyrewardServices.createDailyRewards({Reward_Amount:req.body.Reward_Amount,Addedby:req.userId,Status:Rewardstatus.ACTIVE} );
      if (!result) {
        throw apiError.notFound(responseMessage.ADD_REWARDS_FAILED);
      }
      
    }
      return res.json(new response(result, responseMessage.ADD_REWARDS));
    } catch (error) {
      return next(error);
    }
  }
  
 async GetRewards(req, res,next)  {
  try{
  
    
    const Rewards = await DailyrewardServices.paginateDailyRewards(req.query);
   
    
    if (!Rewards) {
      throw apiError.notFound(responseMessage.REWARDS_NOT_FOUND);
    }
    return res.json(new response(Rewards, responseMessage.REWARDS_FOUND))
  }
catch (error) {
  return next(error);
}
 }



  async getAllRewardPlan(req, res, next) {

    try {
     
      
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const dailyBonusData = await DailyClaimServices.hasExistingClaimToday(
        req.userId
      );
      if (dailyBonusData) {
        return res.json(
          new response(null, responseMessage.REWARD_ALREADY_CLAIMED)
        );
      }
      const dailyPlanData = await DailyrewardServices.findDailyRewards({
        Status: "ACTIVE",
      });
     
      
      if (!dailyPlanData) {
        throw apiError.notFound(responseMessage.DAILY_PLAN_NOT_FOUND);
      }
      return res.json(
        new response(dailyPlanData, responseMessage.GET_DAILYREWARDS_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  async Addclaim(req, res, next) {
    
 
    const validationSchema ={
      Reward_Amount: Joi.number().required(), 
      Status: Joi.string().valid('Claimed').required(),
    };
  
    try {
      const validatedBody = await Joi.validate(req.body,validationSchema);  
    

      let userResult = await findUser({
        _id: req.userId,
        userType: userType.USER,
        status: status.ACTIVE
      });
  

  
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const rewarddata = await DailyrewardServices.findDailyRewards({ Status: Rewardstatus.ACTIVE })
      if (!rewarddata) {
        throw apiError.notFound("No Active Daily reward");
      }

      if (parseFloat(validatedBody.Reward_Amount) !== parseFloat(rewarddata.Reward_Amount)) {
        throw apiError.conflict("Invalid Reward Amount");
      }
      const existingClaim = await DailyClaimServices.hasExistingClaimToday(req.userId);
  
      if (existingClaim) {
        return res.json(new response(existingClaim, responseMessage.CLAIM_ALREADY_EXISTS));
      }
      const InitialBalance = userResult.ticketBalance;
    

      const FinalBalance = InitialBalance + validatedBody.Reward_Amount;
     
  
      const updatedUserBalance = await userServices.updateUserticketBalance(
        { _id: req.userId },
        { ticketBalance: FinalBalance }
      );
  
  
      if (!updatedUserBalance) {
        throw apiError.internalError(responseMessage.TICKET_BALANCE_UPDATE_FAILED);
      }

      const claimData = {
        userId: req.userId,
        Reward_Amount:validatedBody.Reward_Amount,
        Status:validatedBody.Status,
        InitialBalance,   
        FinalBalance 
      };
  
      // 5. Create the Claim
      const claimResult = await DailyClaimServices.createDailyRewardHistory(claimData);
    
      if (!claimResult) {
        throw apiError.internalError(responseMessage.CLAIM_CREATE_FAILED);
      }
  
      return res.json(new response(updatedUserBalance, responseMessage.ADD_CLAIM_SUCCESS));
  
    } catch (error) {
      console.error('Addclaim Controller Error:', error);
      return next(error);
    }
  }

  }

  export default new DailyrewardController();
