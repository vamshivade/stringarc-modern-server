import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { categoryServices } from "../../services/category";
const {
  createCategory,
  categoryCheck,
  findCategory,
  updateCategory,
  paginateCategory,
  updateCategoryById,
} = categoryServices;
import { userServices } from "../../services/user";
const {
  userCheck,
  checkUserExists,
  emailExist,
  createUser,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateUserById,
  paginateSearch,
} = userServices;

import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType, { ADMIN } from "../../../../enums/userType";

export class categoryController {
  /**
   * @swagger
   * /category/addCategory:
   *   post:
   *     tags:
   *       - category
   *     description: addCategory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: categoryTitle
   *         description: categoryTitle
   *         in: formData
   *         required: true
   *       - name: categoryIcon
   *         description: categoryIcon
   *         in: formData
   *         required: false
   *       - name: categoryIcon2
   *         description: categoryIcon2
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async addCategory(req, res, next) {
    let validationSchema = {
      categoryTitle: Joi.string().required(),
      categoryIcon: Joi.string().optional(),
      categoryIcon2: Joi.string().optional(),
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

      var category = await categoryCheck(validatedBody.categoryTitle);
      
      if (category) {
        throw apiError.notFound(responseMessage.CATEGORY_ALREADY_EXIST);
      }
      
      if (validatedBody.categoryIcon) {
        validatedBody.categoryIcon = await commonFunction.getSecureUrl(
          validatedBody.categoryIcon
        );
      }
      if (validatedBody.categoryIcon2) {
        validatedBody.categoryIcon2 = await commonFunction.getSecureUrl(
          validatedBody.categoryIcon2
        );
      }
      var result = await createCategory(validatedBody);
      return res.json(new response(result, responseMessage.CATEGORY_CREATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /category/listCategory:
   *   get:
   *     tags:
   *       - category
   *     description: listCategory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: search
   *         description: search
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

  async listCategory(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      validatedBody.status = "ACTIVE"
      let dataResults = await paginateCategory(validatedBody);
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
  * /category/adminListCategory:
  *   get:
  *     tags:
  *       - category
  *     description: adminListCategory
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: token
  *         description: token
  *         in: header
  *         required: false
  *       - name: status
  *         description: status
  *         in: query
  *         required: false
  *       - name: search
  *         description: search
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

  async adminListCategory(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let dataResults = await paginateCategory(validatedBody);
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
   * /category/deleteCategory:
   *   delete:
   *     tags:
   *       - category
   *     description: deleteCategory
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

  async deleteCategory(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
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
      var categoryInfo = await findCategory({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!categoryInfo) {
        throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
      }
      let deleteRes = await updateCategory(
        { _id: categoryInfo._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /category/editCategory:
   *   put:
   *     tags:
   *       - category
   *     description: editCategory
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: categoryTitle
   *         description: categoryTitle
   *         in: formData
   *         required: false
   *       - name: categoryId
   *         description: _id
   *         in: formData
   *         required: true
   *       - name: categoryIcon
   *         description: categoryIcon
   *         in: formData
   *         required: false
   *       - name: categoryIcon2
   *         description: categoryIcon2
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async editCategory(req, res, next) {
    const validationSchema = {
      categoryId: Joi.string().optional(),
      categoryTitle: Joi.string().required(),
      categoryIcon: Joi.string().optional(),
      categoryIcon2: Joi.string().optional(),
    };
    try {
      var uniqueCheck, updated;
      let validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({ _id: req.userId ,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE});
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      var categoryInfo = await findCategory({
        _id: validatedBody.categoryId,
        status: { $ne: status.DELETE },
      });

      if (!categoryInfo) {
        throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
      }
      if (validatedBody.categoryIcon) {
        validatedBody.categoryIcon = await commonFunction.getSecureUrl(
          validatedBody.categoryIcon
        );
      }
      if (validatedBody.categoryIcon2) {
        validatedBody.categoryIcon2 = await commonFunction.getSecureUrl(
          validatedBody.categoryIcon2
        );
      }
     
        uniqueCheck = await findCategory({
          categoryTitle: validatedBody.categoryTitle,
          _id: { $ne: categoryInfo._id },
          status: { $ne: status.DELETE },
        });
        if (uniqueCheck) {
          throw apiError.conflict(responseMessage.CATEGORY_ALREADY_EXIST);
        }

     
        updated = await updateCategoryById(
          { _id: categoryInfo._id },
          validatedBody
        );
      
      return res.json(new response(updated, responseMessage.CATEGORY_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /category/viewCategory:
   *   get:
   *     tags:
   *       - category
   *     description: viewCategory
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

  async viewCategory(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      var categoryInfo = await findCategory({ _id: validatedBody._id });
      if (!categoryInfo) {
        throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
      }
      return res.json(new response(categoryInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /category/activeDeactiveCategory:
   *   put:
   *     tags:
   *       - category
   *     description: activeDeactiveCategory
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

  async activeDeactiveCategory(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
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
      var userInfo = await findCategory({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      let changedStatus =
        userInfo.status == status.ACTIVE ? status.BLOCK : status.ACTIVE;
      var resData = await updateCategory(
        { _id: userInfo._id },
        { status: changedStatus }
      );

      return res.json(new response(resData, responseMessage.UNBLOCK_BY_ADMIN));
    } catch (error) {
      return next(error);
    }
  }
}
export default new categoryController();
