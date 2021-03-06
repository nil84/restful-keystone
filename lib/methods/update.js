"use strict";
const debug = require("debug")("restful-keystone");
const P = require("bluebird");
const errors = require("errors");
const utils = require("../utils");
const handleResult = utils.handleResult;
const getId = utils.getId;
const _ = require("lodash");

module.exports = function (list,
                           config,
                           entry) {
  config = _.defaults({
    name: list.singular.toLowerCase()
  }, config);
  return {
    handle: function (req,
                      res,
                      next) {
      var id = getId(req);
      debug("UPDATE", config.name, id);
      list.model
        .findById(id, config.show, config)
        .exec()
        .then(function (doc) {
          if (!doc) {
            throw new errors.Http404Error({
              explanation: "Resource not found with id " + id
            });
          }
          var data = req.body;
          _.each(data, function (value,
                                 field) {
            doc[field] = value;
          });
          return P.promisify(doc.save, doc)();
        })
        .then(function (params) {
          var result = params[0]; //params[1]=number of affected
          result = handleResult(result, config);
          res.locals.body = result;
          res.locals.status = 200;
          next();
        })
        .then(null, function (err) {
          next(err);
        });
    },
    verb: "patch",
    url: entry + "/:id"
  };
};
