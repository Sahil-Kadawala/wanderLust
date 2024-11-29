const joi = require("joi");

module.exports.listingSchema = joi.object({
  listing: joi
    .object({
      title: joi.string().required(),
      desc: joi.string().required(),
      price: joi.number().min(0).required(),
      location: joi.string().required(),
      country: joi.string().required(),
      image: joi.string().allow("", null),
    })
    .required(),
});
