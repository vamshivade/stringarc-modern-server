import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import {
  bannerServices
} from "../../services/banner";
const {
  createBanner,
  bannerCheck,
  findBanner,
  findBanners,
  updateBanner,
  paginateBanner,
  updateBannerById,
} = bannerServices;
import {
  userServices
} from "../../services/user";
const {
  findUser,
} = userServices;

import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType, {
  ADMIN
} from "../../../../enums/userType";

export class bannerController {
  /**
   * @swagger
   * /banner/addBanner:
   *   post:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: addBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: bannerURL
   *         description: bannerURL
   *         in: formData
   *         required: false
   *       - name: bannerImage
   *         description: bannerImage
   *         in: formData
   *         type: file
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async addBanner(req, res, next) {
    let validationSchema = {
      bannerImage: Joi.string().optional(),
      bannerURL: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const {
        files
      } = req;
      if (files.length != 0) {
        validatedBody.bannerImage = await commonFunction.getImageUrl(files);
      }
      var result = await createBanner(validatedBody);
      return res.json(new response(result, responseMessage.BANNER_CREATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /banner/listBanner:
   *   get:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: listBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listBanner(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      status: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.USER
        },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let dataResults = await paginateBanner(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /banner/listBannerUser:
   *   get:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: listBanner
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listBannerUser(req, res, next) {

    try {
      let dataResults = await findBanners({status:status.ACTIVE});

      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /banner/deleteBanner:
   *   delete:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: deleteBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async deleteBanner(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var bannerInfo = await findBanner({
        _id: validatedBody._id,
        status: {
          $ne: status.DELETE
        },
      });
      if (!bannerInfo) {
        throw apiError.notFound(responseMessage.BANNER_NOT_FOUND);
      }
      let deleteRes = await updateBanner({
        _id: bannerInfo._id
      }, {
        status: status.DELETE
      });
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /banner/editBanner:
   *   put:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: editBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: bannerURL
   *         description: bannerURL
   *         in: formData
   *         required: false
   *       - name: bannerId
   *         description: _id
   *         in: formData
   *         required: true
   *       - name: bannerImage
   *         description: bannerImage
   *         in: formData
   *         type: file
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async editBanner(req, res, next) {
    const validationSchema = {
      bannerURL: Joi.string().optional(),
      bannerImage: Joi.string().optional(),
      bannerId: Joi.string().optional(),
    };
    try {
      var updated;
      let validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      var bannerInfo = await findBanner({
        _id: validatedBody.bannerId,
        status: {
          $ne: status.DELETE
        },
      });

      if (!bannerInfo) {
        throw apiError.notFound(responseMessage.BANNER_NOT_FOUND);
      }

      const {
        files
      } = req;
      if (files.length != 0) {
        validatedBody.bannerImage = await commonFunction.getImageUrl(files);
      }

      updated = await updateBannerById({
          _id: bannerInfo._id
        },
        validatedBody
      );

      return res.json(new response(updated, responseMessage.BANNER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /banner/viewBanner:
   *   get:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: viewBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewBanner(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);


     
      var bannerInfo = await findBanner({
        _id: validatedBody._id
      });
      if (!bannerInfo) {
        throw apiError.notFound(responseMessage.BANNER_NOT_FOUND);
      }
      return res.json(new response(bannerInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /banner/activeDeactiveBanner:
   *   put:
   *     tags:
   *       - ADMIN_BANNER_MANAGEMENT
   *     description: activeDeactiveBanner
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async activeDeactiveBanner(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findBanner({
        _id: validatedBody._id,
        status: {
          $ne: status.DELETE
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      let changedStatus =
        userInfo.status == status.ACTIVE ? status.BLOCK : status.ACTIVE;
      var resData = await updateBanner({
        _id: userInfo._id
      }, {
        status: changedStatus
      });

      return res.json(new response(resData, responseMessage.UNBLOCK_BY_ADMIN));
    } catch (error) {
      return next(error);
    }
  }
}
export default new bannerController();