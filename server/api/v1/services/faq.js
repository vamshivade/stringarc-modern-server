import status from "../../../enums/status";
import faqModel from "../../../models/faq";


const faqServices = {

    createFAQ: async (insertObj) => {
        return await faqModel.create(insertObj);
    },

    findFAQ: async (query) => {
        return await faqModel.findOne(query);
    },

    updateFAQ: async (query, updateObj) => {
        return await faqModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    FAQList: async (query) => {
        query = { status: { $ne: "DELETE" } };
        return await faqModel.find(query);
    },

    faqListWithPegination: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } };
        const { search, fromDate, toDate, page, limit ,screenName} = validatedBody;
        if (screenName) {
            query.screenName = validatedBody.screenName
        }
        
        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } },
            ]
        }
       
        if (validatedBody.status) {
            query.status = validatedBody.status
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
        };
        return await faqModel.paginate(query, options);
    },

}

module.exports = { faqServices };
