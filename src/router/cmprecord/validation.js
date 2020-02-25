import Joi from 'joi';

export default {
  listRecords: {
    query: {
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      recipient: Joi.string(),
      cmpCampaignId: Joi.string(),
      cmpTemplateId: Joi.string(),
      cmpMediaId: Joi.string(),
      activeStartHour: Joi.number().integer(),
      activeStartMinute: Joi.number().integer(),
      activeEndHour: Joi.number().integer(),
      activeEndMinute: Joi.number().integer(),
      activeOnWeekends: Joi.boolean(),
      timezone: Joi.string(),
      status: Joi.string(),
    },
    params: {},
    body: {},
  },
  searchRecords: {
    query: {
      limit: Joi.number().integer(),
      offset: Joi.number().integer(),
      recipient: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
      cmpCampaignId: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
      cmpTemplateId: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
      cmpMediaId: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
      activeStartHour: Joi.number().integer(),
      activeStartMinute: Joi.number().integer(),
      activeEndHour: Joi.number().integer(),
      activeEndMinute: Joi.number().integer(),
      activeOnWeekends: Joi.boolean(),
      timezone: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
      status: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()),
      ),
    },
    params: {},
    body: {},
  },
  listActiveRecords: {
    query: {
      limit: Joi.number().integer().default(30),
      time: Joi.date(),
    },
    params: {},
    body: {},
  },
  deleteAllRecords: {
    query: {},
    params: {},
    body: {},
  },
  uploadCsv: {
    query: {},
    body: {},
    params: {
      cmpCampaignId: Joi.string().min(1).required(),
    },
  },
  createRecordSingle: {
    query: {},
    params: {},
    body: {
      recipient: Joi.string().min(1).required(),
      cmpCampaignId: Joi.string().min(1).required(),
      cmpTemplateId: Joi.string().min(1).required(),
      cmpMediaId: Joi.string(),
      cmpMedia: Joi.object({
        type: Joi.string().min(1).required(),
        text: Joi.string(),
        url: Joi.string(),
        caption: Joi.string(),
        fileName: Joi.string(),
        latitude: Joi.number(),
        longitude: Joi.number(),
        name: Joi.string(),
        address: Joi.string(),
        actionUrl: Joi.string(),
      }),
      cmpParameters: Joi.array().items(Joi.string().min(1)),
      activeStartHour: Joi.number().integer()
        .min(0)
        .max(23)
        .required(),
      activeStartMinute: Joi.number().integer()
        .min(0)
        .max(59)
        .required(),
      activeEndHour: Joi.number().integer()
        .min(0)
        .max(23)
        .required(),
      activeEndMinute: Joi.number().integer()
        .min(0)
        .max(59)
        .required(),
      activeOnWeekends: Joi.boolean().required(),
      timezone: Joi.string().required(),
    },
  },
  createRecordBatch: {
    query: {},
    params: {},
    body: Joi.array().items({
      recipient: Joi.string().min(1).required(),
      cmpCampaignId: Joi.string().min(1).required(),
      cmpTemplateId: Joi.string().min(1).required(),
      cmpMediaId: Joi.string(),
      cmpMedia: Joi.object({
        type: Joi.string().min(1).required(),
        text: Joi.string(),
        url: Joi.string(),
        caption: Joi.string(),
        fileName: Joi.string(),
        latitude: Joi.number(),
        longitude: Joi.number(),
        name: Joi.string(),
        address: Joi.string(),
        actionUrl: Joi.string(),
      }),
      cmpParameters: Joi.array().items(Joi.string().min(1)),
      activeStartHour: Joi.number().integer()
        .min(0)
        .max(23)
        .required(),
      activeStartMinute: Joi.number().integer()
        .min(0)
        .max(59)
        .required(),
      activeEndHour: Joi.number().integer()
        .min(0)
        .max(23)
        .required(),
      activeEndMinute: Joi.number().integer()
        .min(0)
        .max(59)
        .required(),
      activeOnWeekends: Joi.boolean().required(),
      timezone: Joi.string().required(),
    }).required(),
  },
  readRecord: {
    query: {},
    params: {
      cmpRecordId: Joi.string().min(1).required(),
    },
    body: {},
  },
  deleteRecord: {
    query: {},
    params: {
      cmpRecordId: Joi.string().min(1).required(),
    },
    body: {},
  },
};
