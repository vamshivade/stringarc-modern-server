const cronJob = require("node-cron");
import {
  blockedUserServices
} from "../../services/blockedUserName";
const {
  findBlockedUserName,
} = blockedUserServices;
import {
  userServices
} from "../../services/user";
const {
  findUser,
  updateUser
} = userServices;

let unique = async (userName) => {
  let user = await findUser({
    userName: userName
  });
  let blockedUsernames = await findBlockedUserName({
    "userName.userName":userName
  }); 

  if (user || blockedUsernames) {
    userName = userName + "1";

    return await unique(userName);
  } else {

    return userName;
  }
};


