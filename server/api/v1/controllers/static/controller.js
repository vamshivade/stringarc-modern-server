import Joi from "joi";
import _ from "lodash";
import status from "../../../../enums/status";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import { staticServices } from "../../services/static";
import { faqServices } from "../../services/faq";
import { userServices } from "../../services/user";
import userType from "../../../../enums/userType";

const {
  createStaticContent,
  findStaticContent,
  updateStaticContent,
  staticContentList,
} = staticServices;
const { createFAQ, findFAQ, updateFAQ, FAQList, faqListWithPegination } =
  faqServices;
const {
  userCheck,
  findUser,
  findUserData,
  createUser,
  updateUser,
  updateUserById,
  userSubscriberList,
} = userServices;

export class staticController {
  /**
   * @swagger
   * /static/addStaticContent:
   *   post:
   *     tags:
   *       - STATIC
   *     description: addStaticContent
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: type
   *         description: type
   *         in: formData
   *         required: true
   *       - name: title
   *         description: title
   *         in: formData
   *         required: true
   *       - name: description
   *         description: description
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Static content added successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: User not found.
   *       409:
   *         description: Already exist.
   */
  async addStaticContent(req, res, next) {
    const validationSchema = {
      type: Joi.string().required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
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
      const { type, title, description } = validatedBody;
      let check = await findStaticContent({
        type: type,
        status: status.ACTIVE,
      });
      if (check) {
        throw apiError.notFound(responseMessage.ALREADY_EXIST);
      }
      var result = await createStaticContent({
        type: type,
        title: title,
        description: description,
      });
      return res.json(new response(result, responseMessage.CMS_SAVED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/viewStaticContent:
   *   get:
   *     tags:
   *       - STATIC
   *     description: viewStaticContent
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: type
   *         description: type
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Static data found successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: User not found.
   *       409:
   *         description: Already exist.
   */

  async viewStaticContent(req, res, next) {
    const validationSchema = {
      type: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      var result = await findStaticContent({ type: validatedBody.type });
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/editStaticContent:
   *   put:
   *     tags:
   *       - STATIC
   *     description: editStaticContent
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: false
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: false
   *       - name: title
   *         description: title
   *         in: formData
   *         required: false
   *       - name: description
   *         description: description
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Successfully updated.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: Data not found.
   *       409:
   *         description: Already exist.
   */
  async editStaticContent(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      title: Joi.string().optional(),
      description: Joi.string().optional(),
      email: Joi.array().optional(),
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
      var statisRes = await findStaticContent({ _id: validatedBody._id });
      if (!statisRes) {
        throw apiError.notFound([], responseMessage.DATA_NOT_FOUND);
      }
      var result = await updateStaticContent(
        { _id: statisRes._id },
        validatedBody
      );
      return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/staticContentList:
   *   get:
   *     tags:
   *       - STATIC
   *     description: staticContentList
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: Data not found.
   *       409:
   *         description: Already exist.
   */

  async staticContentList(req, res, next) {
    try {
      var result = await staticContentList();
      if (result.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/addFAQ:
   *   post:
   *     tags:
   *       - STATIC
   *     description: addFAQ
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: screenName
   *         description: screenName
   *         in: formData
   *         required: true
   *       - name: question
   *         description: question
   *         in: formData
   *         required: true
   *       - name: answer
   *         description: answer
   *         in: formData
   *         required: true
   *       - name: image
   *         description: image ?? base64
   *         in: formData
   *         required: false
   *       - name: url
   *         description: url
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: FAQ added successfully.
   */

  async addFAQ(req, res, next) {
    try {
      const validatedBody = await Joi.validate(req.body);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      const { question, answer, image } = validatedBody;

      var result = await createFAQ(validatedBody);

      return res.json(new response(result, responseMessage.FAQ_ADDED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/viewFAQ/{_id}:
   *   get:
   *     tags:
   *       - STATIC
   *     description: viewFAQ
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: _id
   *         description: _id
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: Data not found.
   *       409:
   *         description: Already exist.
   */

  async viewFAQ(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.params, validationSchema);
      var result = await findFAQ({ _id: validatedBody._id });
      if (!result) {
        throw apiError.notFound([], responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(result, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/editFAQ:
   *   put:
   *     tags:
   *       - STATIC
   *     description: editFAQ
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
   *       - name: screenName
   *         description: screenName
   *         in: formData
   *         required: true
   *       - name: question
   *         description: question
   *         in: formData
   *         required: true
   *       - name: answer
   *         description: answer
   *         in: formData
   *         required: true
   *       - name: image
   *         description: image
   *         in: formData
   *         required: false
   *       - name: url
   *         description: url
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Data update successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: Data not found.
   *       409:
   *         description: Already exist.
   */

  async editFAQ(req, res, next) {
    try {
      const validatedBody = await Joi.validate(req.body);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status:  status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var faqRes = await findFAQ({ _id: validatedBody._id });
      if (!faqRes) {
        throw apiError.notFound([], responseMessage.DATA_NOT_FOUND);
      }
      if (validatedBody.image) {
        validatedBody.image = await commonFunction.getSecureUrl(
          validatedBody.image
        );
      }
      var result = await updateFAQ({ _id: faqRes._id }, validatedBody);

      return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/deleteFAQ:
   *   delete:
   *     tags:
   *       - STATIC
   *     description: deleteFAQ
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
   *         description: Deleted successfully.
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: FAQ data not found/User not found
   *       409:
   *         description: Already exist.
   */

  async deleteFAQ(req, res, next) {
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
      var faqInfo = await findFAQ({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!faqInfo) {
        throw apiError.notFound(responseMessage.FAQ_NOT_FOUND);
      }
      let deleteRes = await updateFAQ(
        { _id: faqInfo._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /static/faqList:
   *   get:
   *     tags:
   *       - STATIC
   *     description: faqList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: screenName
   *         description: screenName
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: screenName
   *         description: screenName
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
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
   *         description: data found successfully.
   *       404:
   *         description: Data not found
   */

  async faqList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      screenName: Joi.string().optional(),
      status: Joi.string().optional(),
      screenName: Joi.string().optional().allow(''),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let dataResults = await faqListWithPegination(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
}

export default new staticController();
