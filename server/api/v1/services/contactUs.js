
import contactUsModel from "../../../models/contactUs";
import statuss from '../../../enums/status';



const contactUsServices = {

    createContactUs: async (insertObj) => {
        return await contactUsModel.create(insertObj);
    },
    findContactUs: async (insertObj) => {
      return await contactUsModel.findOne(insertObj);
  },
  updateContactUs: async (query,updateObj) => {
      return await contactUsModel.findOneAndUpdate(query,updateObj);
  },
  deleteAllContactUs: async () => {
    return await contactUsModel.deleteMany({});
},
    getAllContactUs: async (insertObj) => {
      
       let query = { status: { $ne: statuss.DELETE } };
       const { search, fromDate, toDate, page, limit,status,reply } = insertObj;
       if (search) {
         query.$or = [
           { email: { $regex: search, $options: 'i' } },
         ]
       }
   
       if(status){
         query.status=status
       }
       if(reply){
         query.reply=reply
       }
       if (fromDate && !toDate) {
         query.createdAt = { $gte: fromDate };
       }
       if (!fromDate && toDate) {
         query.createdAt = { $lte: toDate };
       }
       if (fromDate && toDate) {
         query.$and = [
           { createdAt: { $gte: fromDate } },
           { createdAt: { $lte: toDate } },
         ]
       }
      
        let options = {
            page: Number(page) || 1,
            limit: Number(limit) || 10, 
             sort: { createdAt: -1 },
             select: '-otp -password -base64 -secretGoogle -emailotp2FA -withdrawOtp'
          };
          return await contactUsModel.paginate(query, options);
    },

    viewContactUs: async (insertObj) => {
        return await contactUsModel.findOne(insertObj);
    },
    contactUsCount: async (query) => {
        return await contactUsModel.countDocuments(query);
      },

}

module.exports = { contactUsServices };
