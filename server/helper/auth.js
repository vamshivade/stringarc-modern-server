import config from "config";
import jwt from "jsonwebtoken";
import userModel from "../models/user";
import apiError from './apiError';
import responseMessage from '../../assets/responseMessage';
const { decryptionData } = require('./cryptoUtils')
import * as crypto from 'crypto';

const verifyTimestamp = (timestamp) => {
  const currentTime = new Date().getTime();
  console.log(currentTime, "currentTime", timestamp, "timestamp");
  const timeDifference = Math.abs(currentTime - timestamp);
  const validTimeWindow = 20000; // 5 seconds
  console.log(timeDifference, validTimeWindow);

  // If the time difference is within the valid window (e.g., 5 seconds)
  if (timeDifference <= validTimeWindow) {
    return true; // Valid
  }
  return false; // Invalid
};



module.exports = {
  async verifyToken(req, res, next) {

    try {
      if (req.headers.token) {


        const decodedToken = await jwt.verify(
          req.headers.token,
          process.env.jwtsecret
        );

        if (decodedToken) {
          const result2 = await userModel.findOne({ _id: decodedToken._id });

          if (!result2) {
            return res.status(404).json({
              responseCode: 404,
              responseMessage: "USER NOT FOUND"
            });
          }
          if (result2.status === "BLOCK") {
            return res.status(403).json({
              responseCode: 403,
              responseMessage: "You have been blocked by admin."
            });
          } else if (result2.status === "DELETE") {
            return res.status(402).json({
              responseCode: 402,
              responseMessage: "Your account has been deleted by admin."
            });
          } else {
            req.userId = decodedToken._id;
            req.userDetails = decodedToken;
            next();
          }
        }
      } else {
        throw apiError.invalid(responseMessage.NO_TOKEN);
      }
    } catch (error) {
      console.log("error=>>", error);
    }
  },

  async verifyClient(req, res, next) {

    try {
      req.headers['original-url'] = req.originalUrl
      console.log(req.headers, "headers");
      // const headersJson = {
      //   clientid:req.headers.clientid,
      //   host: req.headers.host,
      //   referer: req.headers.referer,
      //   apiUrl: req.headers.apiurl,
      //   cfIpCountry: req.headers['cf-ipcountry'],
      //   cfConnectingIp: req.headers['cf-connecting-ip'],
      //   uaPlatform: req.headers['sec-ch-ua-platform'],
      //   userAgent: req.headers['user-agent'],
      //   origin: req.headers.origin,
      //   requestedWith: req.headers['x-requested-with'],
      // };

      // console.log(JSON.stringify(headersJson, null, 2),"headers");
      if (req.headers['postman-token']) {
        throw apiError.invalid("Invalid Request");
      }
      if (req.headers['user-agent'] === 'ELB-HealthChecker/2.0') {
        return next();
      }

      if (!req.headers.clientid && (req.headers['user-agent'] !== 'ELB-HealthChecker/2.0')) {
        throw apiError.invalid("Invalid Client");
      }
      const decodedToken = await decryptionData(
        req.headers.clientid
      );


      if (!decodedToken) {
        throw apiError.invalid(responseMessage.CLIENT_TOKEN);
      }
      if (decodedToken.split("&TimeStamp=")[0] != process.env.encryptionKey) {
        throw apiError.invalid({ message: "Invalid key" });
      }
      const timestamp = decodedToken.split("&TimeStamp=")[1];

      if (!timestamp) {
        throw apiError.invalid({ message: "Invalid api call" });
      }


      if (verifyTimestamp(timestamp)) {
        next();
      } else {
        throw apiError.invalid({ message: "clientId has expired" });
      }

    } catch (error) {
      console.log(error, "error");

      return next(error);
    }
  },



   async verifyInitData(req, res, next) {
      try {
      
        const rawQuery = req.headers.initdata;
        console.log("rawQuery :", rawQuery);
  
        if (!rawQuery) {
          throw apiError.invalid("Raw query not provided");
         
        }
  
       
        const keyValuePairs = rawQuery.split('&');
        const filteredPairs = keyValuePairs.filter(pair => !pair.startsWith('hash='));
   
        const hashPair = keyValuePairs.find(pair => pair.startsWith('hash='));
   
  
        // then split if it exists
        const receivedHash = hashPair
          ? hashPair.split('=')[1]
          : undefined;
   
  
  
        if (!receivedHash) {
        
          throw apiError.invalid({ message: "Hash parameter missing" });
  
        }
  
        const decodedPairs = filteredPairs.map(pair => {
          const [key, value] = pair.split('=');
          return `${key}=${decodeURIComponent(value)}`;
        });

        const dataCheckString = decodedPairs.sort().join('\n');
  
    const userField = decodedPairs.find((pair) => pair.startsWith("user="));
    if (userField) {
      const userValue = userField.split("=")[1];
     
      req.userData = JSON.parse(userValue);
    } else {
      console.log("User field not found");
    }
    
    
     const envToken =
        req.route.path === "/swlogin"
          ? process.env.Withdraw_Token
          : process.env.Bot_Token;
 
  
      
        const secretKey = crypto
          .createHmac('sha256', 'WebAppData') 
          .update(envToken) 
          .digest();
     
  
       
        const computedHash = crypto
          .createHmac('sha256', secretKey)
          .update(dataCheckString)
          .digest('hex');
 
  

        const isValid = computedHash === receivedHash;
  
      
  
  
        if (isValid) {
          next();
        } else {
         
          throw apiError.invalid({ message: "Invalid hash" });
        }

      } catch (error) {
        console.log(error, "error");
  
        return next(error);
      }
    },

  verifyTokenBySocket: (token) => {
    return new Promise((resolve, reject) => {
      try {
        if (token) {
          jwt.verify(token, process.env.jwtsecret, (err, result) => {
            if (err) {
              reject(apiError.unauthorized());
            }
            else {
              userModel.findOne({ _id: result.id }, (error, result2) => {
                if (error)
                  reject(apiError.internal(responseMessage.INTERNAL_ERROR));
                else if (!result2) {
                  reject(apiError.notFound(responseMessage.USER_NOT_FOUND));
                }
                else {
                  if (result2.status == "BLOCK") {
                    reject(apiError.forbidden(responseMessage.BLOCK_BY_ADMIN));
                  }
                  else if (result2.status == "DELETE") {
                    reject(apiError.unauthorized(responseMessage.DELETE_BY_ADMIN));
                  }
                  else {
                    resolve(result.id);
                  }
                }
              })
            }
          })
        } else {
          reject(apiError.badRequest(responseMessage.NO_TOKEN));
        }
      }
      catch (e) {
        reject(e);
      }
    })
  }

}
