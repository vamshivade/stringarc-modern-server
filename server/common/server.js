import express from "express";
import Mongoose from "mongoose";
import * as http from "http";
import * as path from "path";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import apiErrorHandler from "../helper/apiErrorHandler";
import bot from "../bot.js"; // Import bot.js


const app = new express();
const server = http.createServer(app);
const root = path.normalize(`${__dirname}/../..`);

import config from "config";

class ExpressServer {
  constructor() {
    app.use(express.json({ limit: "1000mb" }));

    app.use(express.urlencoded({ extended: true, limit: "1000mb" }));

    app.use(morgan("dev"));

    app.use(
      cors({
        allowedHeaders: "*",
        exposedHeaders: ["token", "authorization"],
        origin: ["https://modfront.strtesting.com","https://tele-modfront.stringarc8.io", "https://modfront.strtesting.com",
          "https://tele-modadmin.stringarc8.io", "https://stringwithdrawadmin.stringgames.io", "https://stringwithdraw.stringgames.io",
        "https://giftomania.rocks/","https://api.giftomania.rocks"],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
      }),
    );
  }

  router(routes) {
    routes(app);
    return this;
  }

  configureSwagger(swaggerDefinition) {
    const options = {
      // swaggerOptions : { authAction :{JWT :{name:"JWT", schema :{ type:"apiKey", in:"header", name:"Authorization", description:""}, value:"Bearer <JWT>"}}},
      swaggerDefinition,
      apis: [
        path.resolve(`${root}/server/api/v1/controllers/**/*.js`),
        path.resolve(`${root}/api.yaml`),
      ],
    };

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerJSDoc(options)),
    );
    return this;
  }

  handleError() {
    app.use(apiErrorHandler);

    return this;
  }

  configureDb(dbUrl) {
    return new Promise(async (resolve, reject) => {
      try {
        await Mongoose.connect(dbUrl, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          // family: 4,
          // keepAlive: true,
          // connectTimeoutMS: 1000 * 60 * 5
        });

        console.log("Mongodb connection established");
        resolve(this);
      } catch (err) {
        console.error(`Error in mongodb connection ${err.message}`);
        reject(err);
      }
    });
  }

  // })

  listen(port) {
    server.listen(port, "0.0.0.0", () => {
      console.log(
        `secure app is listening @port ${port}`,
        new Date().toLocaleString(),
      );
    });
    return app;
  }
}

export default ExpressServer;

function originIsAllowed(origin) {
  return true;
}
