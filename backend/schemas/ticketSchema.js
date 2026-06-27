const Joi = require('joi');
const { VALID_ISSUE_TYPES, VALID_CATEGORIES, VALID_DEPARTMENTS } = require('../config/constants');

const ticketSchema = Joi.object({
  issueType:    Joi.string().valid(...VALID_ISSUE_TYPES).required(),
  category:     Joi.string().valid(...VALID_CATEGORIES).required(),
  severity:     Joi.number().integer().min(1).max(10).required(),
  dangerLevel:  Joi.string().valid('safe','moderate','critical').required(),
  departmentId: Joi.string().valid(...VALID_DEPARTMENTS).required(),
  description:  Joi.string().max(500).pattern(/^[^<>{}]*$/).required(),
  location: Joi.object({
    lat:     Joi.number().min(-90).max(90).required(),
    lng:     Joi.number().min(-180).max(180).required(),
    ward:    Joi.string().max(100).required(),
    city:    Joi.string().max(100).required(),
    address: Joi.string().max(300).required(),
  }).required(),
  phone:       Joi.string().pattern(/^\+?[1-9]\d{9,14}$/).optional().allow('', null),
  email:       Joi.string().email().optional().allow('', null),
  citizenName: Joi.string().max(100).optional().allow('', null),
  aiSuggested: Joi.object().optional(),
  hasMismatch: Joi.boolean().optional(),
  bypassDuplicateOf:       Joi.string().optional().allow('', null),
  duplicateMatchConfidence: Joi.number().optional(),
});

module.exports = { ticketSchema };
