import Joi from "joi";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import auth from "../../../../helper/auth";
import axios from "axios";

import userType from "../../../../enums/userType";
import { userServices } from "../../services/user";

const { findUser, userCount, userList } = userServices;


var responses;

export class notificationController {

  async Usernotification(req, res, next) {


    let validationSchema = {
      Notification: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let adminRes = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminRes) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      res.json(new response("Success", "Notifications are being sent"))


      const delayBetweenBatches = 1000;

      const batchSize = 500;
      const maxRequestsPerSecond = 30;
      const interval = 1000 / maxRequestsPerSecond;

      // Function to send a batch of notifications
      const sendBatch = async (batch) => {
        for (let i = 0; i < batch.length; i++) {
          const user = batch[i];
          const chatId = user.chatId;
          const sendMessageUrl = `https://api.telegram.org/bot${process.env.Bot_Token}/sendMessage`;

          try {
            const response = await axios.get(sendMessageUrl, {
              params: {
                chat_id: chatId,
                text: validatedBody.Notification,
              },
            });

            if (response.data.ok) {
              console.log(`Notification sent to user ${chatId}`);
            } else {
              console.error(`Failed to send notification to user ${chatId}:`, response.data);
            }
          } catch (error) {
            if (error.response) {
              if (error.response.status === 429) {
                console.warn(`Rate limit hit for user ${chatId}. Skipping until limit is restored.`);
              } else {
                console.error(`Error sending notification to user ${chatId}:`, {
                  status: error.response.status,
                  data: error.response.data,
                });
              }
            } else if (error.request) {
              console.error(`No response received for user ${chatId}:`, error.request);
            } else {
              console.error(`Error setting up request for user ${chatId}:`, error.message);
            }
          }


          if (i < batch.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        }
      };


      processNotifications();

      async function processNotifications() {
        try {
          const totalUsers = await userCount();
          for (let i = 0; i < totalUsers; i += batchSize) {
            const query = {}
            const projection = { chatId: 1 };

            // Define the options (limit and skip)
            const options = {
              limit: batchSize,
              skip: i
            };

            // Execute the query with the specified projection and options
            const batch = await userList(query, projection, options);

            if (batch && batch.length > 0) {
              await sendBatch(batch);
              console.log(`Batch ${i} processed successfully.`);
            } else {
              console.log(`No users found for batch starting at index ${i}`);
            }

            if (delayBetweenBatches > 0 && i + batchSize < totalUsers) {
              console.log(`Waiting for ${delayBetweenBatches} ms before sending the next batch...`);
              await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
            }
          }
        } catch (error) {
          console.error("Error processing notifications:", error.message);
        }
      }
    } catch (error) {
      return next(error)
    }
  };
}

export default new notificationController();
