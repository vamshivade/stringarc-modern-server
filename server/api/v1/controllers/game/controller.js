import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { gameServices } from "../../services/game";
const {
  createGame,
  gameCheck,
  findGame,
  updateGame,
  paginateGame,
  updateGameById,
  findGameAll,
  searchGames,
} = gameServices;
import { userServices } from "../../services/user";
const { findUser } = userServices;
import { categoryServices } from "../../services/category";
const {
  createCategory,
  categoryCheck,
  findCategory,
  updateCategory,
  paginateCategory,
  updateCategoryById,
} = categoryServices;
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType, { ADMIN } from "../../../../enums/userType";

export class GameController {
  /**
   * @swagger
   * /game/addGame:
   *   post:
   *     tags:
   *       - Game
   *     description: addGame
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: gameTitle
   *         description: gameTitle
   *         in: formData
   *         required: true
   *       - name: gameDetails
   *         description: gameDetails
   *         in: formData
   *         required: true
   *       - name: gamePic
   *         description: gamePic
   *         in: formData
   *         type: file
   *         required: true
   *       - name: category
   *         description: category
   *         in: formData
   *         required: true
   *       - name: levelPrice
   *         description: levelPrice
   *         in: formData
   *         required: false
   *       - name: level
   *         description: level
   *         in: formData
   *         required: false
   *       - name: rules
   *         description: rules
   *         in: formData
   *         required: false
   *       - name: withdrawalRules
   *         description: withdrawalRules
   *         in: formData
   *         required: false
   *       - name: disclaimer
   *         description: disclaimer
   *         in: formData
   *         required: false
   *       - name: latest
   *         description: latest(boolean)
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async addGame(req, res, next) {
    let validationSchema = {
      gameTitle: Joi.string().optional(),
      gameDetails: Joi.string().optional(),
      category: Joi.string().optional(),
      gamePic: Joi.string().optional(),
      levelPrice: Joi.number().optional(),
      level: Joi.array()
        .items(
          Joi.object({
            level: Joi.string().default("1"),
            multiplier: Joi.string().default("1"),
            additionalParams: Joi.object().unknown(true).optional(),
          }),
        )
        .optional(),
      rules: Joi.array().optional(),
      withdrawalRules: Joi.array().optional(),
      disclaimer: Joi.string().optional(),
      min: Joi.number().optional(),
      max: Joi.number().optional(),
      latest: Joi.boolean().optional(),
      additionalParams: Joi.object().unknown(true).optional(),
      
      
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let category = await findCategory({
        categoryTitle: validatedBody.category,
      });
      if (!category) {
        throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
      }
      var game = await gameCheck(validatedBody.gameTitle);
      if (game) {
        throw apiError.notFound(responseMessage.GAME_ALREADY_EXIST);
      }
      const { files } = req;
      if (files.length != 0) {
        validatedBody.gamePic = await commonFunction.getImageUrl(files);
      }
      var result = await createGame(validatedBody);
      return res.json(new response(result, responseMessage.GAME_CREATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /game/listgame:
   *   get:
   *     tags:
   *       - game
   *     description: listgame
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status (ACTIVE/BLOCK)
   *         in: query
   *         required: false
   *       - name: category
   *         description: category
   *         in: query
   *         required: false
   *       - name: fromDate
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
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: latest
   *         description: latest(boolean)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listGame(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
      category: Joi.string().optional(),
      latest: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      //  validatedBody.status =status.ACTIVE
      let dataResults = await paginateGame(validatedBody);
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
   * /game/listGameAll:
   *   get:
   *     tags:
   *       - game
   *     description: listGameAll
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listGameAll(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let dataResults = await findGameAll({ status: status.ACTIVE });
      if (dataResults.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /game/userGameList:
   *   get:
   *     tags:
   *       - USERgame
   *     description: userGameList
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
   *       - name: categoryId
   *         description: categoryId
   *         in: query
   *         required: false
   *       - name: latest
   *         description: latest
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async userGameList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      categoryId: Joi.string().optional(),
      latest: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);

      if (validatedBody.categoryId) {
        let category = await findCategory({ _id: validatedBody.categoryId });

        validatedBody.category = category.categoryTitle;
      }

      validatedBody.status = "ACTIVE";
      let dataResults = await paginateGame(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /game/searchGame:
   *   get:
   *     tags:
   *       - USERgame
   *     description: userGameList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async searchGame(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      if (!validatedBody.search) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      let dataResults = await searchGames(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /game/userGameListAll:
   *   get:
   *     tags:
   *       - game
   *     description: userGameListAll
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async userGameListAll(req, res, next) {
    try {
      let dataResults = await findGameAll({ status: status.ACTIVE });
      if (dataResults.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /game/deletegame:
   *   delete:
   *     tags:
   *       - game
   *     description: deletegame
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

  async deleteGame(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var gameInfo = await findGame({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      let deleteRes = await updateGame(
        { _id: gameInfo._id },
        { status: status.DELETE },
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /game/editgame:
   *   put:
   *     tags:
   *       - game
   *     description: editgame
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
   *       - name: gameTitle
   *         description: gameTitle
   *         in: formData
   *         required: false
   *       - name: gameDetails
   *         description: gameDetails
   *         in: formData
   *         required: false
   *       - name: gamePic
   *         description: gamePic
   *         in: formData
   *         type: file
   *         required: false
   *       - name: category
   *         description: category
   *         in: formData
   *         required: false
   *       - name: levelPrice
   *         description: levelPrice
   *         in: formData
   *         required:
   *       - name: level
   *         description: level
   *         in: formData
   *         required: false
   *       - name: rules
   *         description: rules
   *         in: formData
   *         required: false
   *       - name: withdrawalRules
   *         description: withdrawalRules
   *         in: formData
   *         required: false
   *       - name: disclaimer
   *         description: disclaimer
   *         in: formData
   *         required: false
   *       - name: latest
   *         description: latest(boolean)
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async editGame(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      gameTitle: Joi.string().optional(),
      gameDetails: Joi.string().optional(),
      category: Joi.string().optional(),
      gamePic: Joi.string().optional(),
      levelPrice: Joi.number().optional(),
      level: Joi.array()
        .items(
          Joi.object({
            level: Joi.string().default("1"),
            multiplier: Joi.string().default("1"),
            additionalParams: Joi.object().unknown(true).optional(),
          }),
        )
        .optional(),
      rules: Joi.array().optional(),
      withdrawalRules: Joi.array().optional(),
      disclaimer: Joi.string().optional(),
      min: Joi.number().optional(),
      max: Joi.number().optional(),
      latest: Joi.boolean().optional(),
      additionalParams: Joi.object().unknown(true).optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema, {
        stripUnknown: true,
      });

      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let games = await findGame({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!games) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      if (validatedBody.category) {
        let category = await findCategory({
          categoryTitle: validatedBody.category,
        });
        if (!category) {
          throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
        }
      }

      if (validatedBody.gameTitle != games.gameTitle) {
        var game = await gameCheck(validatedBody.gameTitle);
        if (game) {
          throw apiError.notFound(responseMessage.GAME_ALREADY_EXIST);
        }
      }
      const { files } = req;

      if (files) {
        if (files.length != 0) {
          validatedBody.gamePic = await commonFunction.getImageUrl(files);
        }
      }

      var result = await updateGameById({ _id: games._id }, validatedBody);
      return res.json(new response(result, responseMessage.GAME_UPDATED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /game/viewgame:
   *   get:
   *     tags:
   *       - ADMIN_GAME_MANAGEMENT
   *     description: viewgame
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewGame(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var gameInfo = await findGame({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(gameInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /game/userViewGame:
   *   get:
   *     tags:
   *       - USERgame
   *     description: viewgame
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

  async userViewGame(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);

      var gameInfo = await findGame({
        _id: validatedBody._id,
        status: status.ACTIVE,
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      return res.json(new response(gameInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /game/activeDeactiveGame:
   *   put:
   *     tags:
   *       - game
   *     description: activeDeactivegame
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

  async activeDeactiveGame(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.GAME_NOT_FOUND);
      }
      var gameInfo = await findGame({
        _id: validatedBody._id,
      });
      if (!gameInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      let changedStatus =
        gameInfo.status == status.ACTIVE ? status.BLOCK : status.ACTIVE;
      var resData = await updateGame(
        { _id: gameInfo._id },
        { status: changedStatus },
      );
      if (changedStatus == status.BLOCK) {
        return res.json(new response(resData, responseMessage.GAME_BLOCK));
      } else {
        return res.json(new response(resData, responseMessage.GAME_ACTIVE));
      }
    } catch (error) {
      return next(error);
    }
  }
}
export default new GameController();
