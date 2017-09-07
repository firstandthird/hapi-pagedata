'use strict';
const hoek = require('hoek');
const Joi = require('joi');
const PageData = require('pagedata');
const pkg = require('./package.json');

const defaults = {
  verbose: true,
  cacheEndpoint: false,
  userAgent: '',
  status: 'published',
  pageCache: false,
  projectPagesCache: false,
  collectionPagesCache: false,
  // example options for pageCache/projectPagesCache/collectionPagesCache:
  // {
  //   expiresIn: 1000 * 60 * 60 * 24 * 7, //1 week
  //   staleIn: 1000 * 60 * 60 * 23, //23 hours
  //   staleTimeout: 200,
  //   generateTimeout: 5000
  // }
};

exports.register = function(server, options, next) {
  const config = hoek.applyToDefaults(defaults, options, true);

  const schema = Joi.object().keys({
    host: Joi.string().uri().required(),
    key: Joi.string().required(),
    status: Joi.string().allow(['drafts', 'published']),
    pageCache: Joi.object().allow(false),
    projectPagesCache: Joi.object().allow(false),
    collectionPagesCache: Joi.object().allow(false),
    cacheEndpoint: Joi.string().allow(false),
    userAgent: Joi.string().allow(''),
    verbose: Joi.boolean()
  });

  const validation = schema.validate(config);
  if (validation.error) {
    return next(validation.error);
  }

  if (!config.userAgent) {
    config.userAgent = `hapi-pagedata/${pkg.version}`;
  }

  const api = new PageData(config.host, config.key, config.userAgent);

  server.expose('api', api);

  require('./methods/getPage')(server, api, config);
  require('./methods/getProjectPages')(server, api, config);
  require('./methods/getCollectionPages')(server, api, config);

  next();
};

exports.register.attributes = {
  once: true,
  pkg
};
