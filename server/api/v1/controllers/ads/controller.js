import responseMessage from "../../../../../assets/responseMessage";
import status from "../../../../enums/status";
import Adstatus from "../../../../enums/Taskstatus";
import Joi from "joi";

import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";

import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";
const { findUser } = userServices;
import { adsRewardServices } from "../../services/adsreward";
import { adminSettingServices } from "../../services/adminSettings";
import { AdsServices } from "../../services/ads";

export class AdsController {
  async AddAds(req, res, next) {


    const validationSchema = {
      AdName: Joi.string().optional(),
      AdSDK: Joi.string().optional(),
      AdImage: Joi.string().optional(),
      Rewardpoints: Joi.number().required(),
      AdCount: Joi.number().optional(),
      AdTimer_InMinutes: Joi.number().optional(),
      _id: Joi.string().optional(),
      Status: Joi.string().optional()

    };
    try {

      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (req.body._id) {


        var result = await AdsServices.updateAdsById({ _id: req.body._id }, {
          AdName: req.body.AdName, AdSDK: req.body.AdSDK, Rewardpoints: req.body.Rewardpoints,
          AdImage: req.body.AdImage, AdCount: req.body.AdCount, AdTimer_InMinutes: req.body.AdTimer_InMinutes, Addedby: req.userId, Status: validatedBody.Status
        });
        if (!result) {
          throw apiError.notFound(responseMessage.EDIT_ADS_FAILED);
        }

      } else {
        var result = await AdsServices.createAds({
          AdName: req.body.AdName, AdSDK: req.body.AdSDK, Rewardpoints: req.body.Rewardpoints, AdImage: req.body.AdImage,
          AdCount: req.body.AdCount, AdTimer_InMinutes: req.body.AdTimer_InMinutes, Addedby: req.userId, Status: Adstatus.ACTIVE
        });
        if (!result) {
          throw apiError.notFound(responseMessage.ADD_ADS_FAILED);
        }

      }
      return res.json(new response(result, responseMessage.ADD_ADS));
    } catch (error) {
      return next(error);
    }
  }

  async GetAds(req, res, next) {
    try {
      const ads = await AdsServices.findAdsAll();
      

      if (!ads) {
        throw apiError.notFound(responseMessage.ADS_NOT_FOUND);
      }
      return res.json(new response(ads, responseMessage.ADS_FOUND))
    }
    catch (error) {
      return next(error);
    }
  }

  async AdRewards(req, res, next) {
    // Define the validation schema
    const validationSchema = {
      Rewardpoints: Joi.number().required(),
      AdId: Joi.string().optional(),
      NextAd_Time: Joi.date().required(),
    };

    try {
      // Validate the request body
      const validatedBody = await Joi.validate(req.body, validationSchema);

      const adData = await AdsServices.findAdsById(validatedBody.AdId);
      if (!adData) {
        throw apiError.notFound(responseMessage.INVALID_AD_ID);
      }
      if (parseFloat(validatedBody.Rewardpoints) != parseFloat(adData.Rewardpoints)) {
        throw apiError.conflict("Invalid Reward amount");
      }
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const AdsRewardData = await adsRewardServices.getTodayAdsRewardsByAdId(
        validatedBody.AdId,
        req.userId
      );
      if (
        validatedBody.AdId == adData._id &&
        AdsRewardData.length >= adData.AdCount
      ) {
        return res.json(new response(null, responseMessage.AD_LIMIT_EXCEEDED));
      }

      const adsRewardResult = await adsRewardServices.createAdReward({
        user_id: req.userId,
        AdId: validatedBody.AdId,
        Rewardpoints: validatedBody.Rewardpoints,
        InitialBalance: parseFloat(userResult.ticketBalance),
        FinalBalance: parseFloat(userResult.ticketBalance + validatedBody.Rewardpoints),
        NextAd_Time: validatedBody.NextAd_Time,
      });
      if (!adsRewardResult) {
        throw apiError.notFound(responseMessage.AD_REWARD_CREATION_FAILED);
      }

      const updatedUserBalance = await userServices.updateUserticketBalance(
        { _id: req.userId },
        {
          ticketBalance: parseFloat(
            userResult.ticketBalance + validatedBody.Rewardpoints
          ),
        }
      );

      if (!updatedUserBalance) {
        throw apiError.internalError(
          responseMessage.TICKET_BALANCE_UPDATE_FAILED
        );
      }

      return res.json(
        new response(adsRewardResult, responseMessage.ADS_REWARD_ADDED_SUCCESS)
      );
    } catch (error) {
      return next(error);
    }
  }

  async GetAdsEndTime(req, res, next) {
    try {
      // Fetch all active ads
      const ads = await AdsServices.findAdsAll({ Status: Adstatus.ACTIVE });

      if (!ads || ads.length === 0) {
        throw apiError.notFound("No Active ads");
      }

      // Add adNextEndTime for each ad
      const adsWithNextEndTime = await Promise.all(
        ads.map(async (ad) => {
          // Fetch adNextEndTime for the current ad and user
          const adReward = await adsRewardServices.AdsRewardFind(
            { AdId: ad._id, user_id: req.userId }
          );
      

          // Extract adNextEndTime or set to null if not found
          const adNextEndTime = adReward ? adReward.NextAd_Time : null;

          return {
            adId: ad._id,
            adNextEndTime,
          };
        })
      );

   

      // Return the modified ads list
      return res.json(
        new response(adsWithNextEndTime, "Ads endtime fetched successfully")
      );
    } catch (error) {
      return next(error);
    }
  }








}

export default new AdsController();
