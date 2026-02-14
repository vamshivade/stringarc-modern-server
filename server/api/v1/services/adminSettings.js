import User from "../../../models/user";
import AdminSettings from "../../../models/adminSettings"



const adminSettingsServices = {

 getAdCountSettings:async () => {
    return await AdminSettings.findOne().select("Ad1Count Ad2Count");
  },

}
  module.exports = { adminSettingsServices };