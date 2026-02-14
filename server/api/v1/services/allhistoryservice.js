import Usertask from "../../../models/usertasks";
import status from "../../../enums/Taskstatus";
import User from "../../../models/user";
import AdsRewardHistory from "../../../models/AdsRewardhistorymodel"
import BoosterTransaction from "../../../models/BoosterTransaction";
import Booster from "../../../models/Booster";
import DailyRewardHistory from "../../../models/DailyRewardhistory";
import gameHistory from "../../../models/gameHistory";
import statuss from '../../../enums/status';
import ReferralHistory from "../../../models/Referralhistory";
const AllhistoriesServices = {
  
    async paginateAllHistory(validatedBody) {
        const { page, limit , fromDate, toDate, search } = validatedBody;
      
        // Prepare the filter conditions for each history type
        const filter = {};
        if (fromDate) filter.createdAt = { $gte: new Date(fromDate) };
        if (toDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(toDate) };
        if (search) filter.title = { $regex: search, $options: 'i' }; // Example search filter
      
        // Fetch data for each type of history
        const boosterData = await BoosterTransaction.find(filter).sort({ createdAt: -1 });
        const adsData = await AdsRewardHistory.find(filter).sort({ createdAt: -1 });
        const taskData = await Usertask.find(filter).sort({ createdAt: -1 });
        const dailyRewardData = await DailyRewardHistory.find(filter).sort({ createdAt: -1 });
        const referralData = await ReferralHistory.find(filter).sort({ createdAt: -1 });
        const gameHistoryData = await gameHistory.find(filter).sort({ createdAt: -1 });
      
        // Combine all history data into a single array
        const combinedData = [
          ...boosterData,
          ...adsData,
          ...taskData,
          ...dailyRewardData,
          ...referralData,
          ...gameHistoryData,
        ];
      
        // Sort combined data by created date
        combinedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
        // Apply pagination (skip and limit)
        const skip = (page - 1) * limit;
        const limitNumber = parseInt(limit);
      
        // Paginate combined data
        const paginatedData = combinedData.slice(skip, skip + limitNumber);
      
        return paginatedData;
      }
      
    }
export { AllhistoriesServices };





