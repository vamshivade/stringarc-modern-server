//v7 imports
import admin from "./api/v1/controllers/admin/routes";
import referral from "./api/v1/controllers/admin/partnerreferral";
import user from "./api/v1/controllers/user/routes";
import ticket from "./api/v1/controllers/tickets/routes";
import statics from "./api/v1/controllers/static/routes";
import category from "./api/v1/controllers/category/routes";
import solana from "./api/v1/controllers/solana/routes";
import games from "./api/v1/controllers/game/routes";
import Tasks from "./api/v1/controllers/Tasks/routes";
import notification from "./api/v1/controllers/notification/routes";
import banner from "./api/v1/controllers/banner/routes";
import rewards from "./api/v1/controllers/Dailyrewards/routes";
import ADS from "./api/v1/controllers/ads/routes";
import booster from "./api/v1/controllers/Boosters/routes";
import auth from "./helper/auth";
/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  
  app.use("/api/v1/admin", admin);
  app.use("/api/partner",referral);
  // app.use(auth.verifyClient)
  app.use("/api/v1/user", user);
  app.use("/api/v1/ticket", ticket);
  app.use("/api/v1/static", statics);
  app.use("/api/v1/category", category);
  app.use("/api/v1/solana", solana);
  app.use("/api/v1/game", games);
  app.use("/api/v1/task", Tasks);
  app.use("/api/v1/rewards", rewards);
  app.use("/api/v1/ads", ADS);
  app.use("/api/v1/notification", notification);
  app.use("/api/v1/banner", banner);
  app.use("/api/v1/Booster", booster);
 

  return app;
}
