'use strict';
const hoek = require('hoek');
const Joi = require('joi');
const PageData = require('pagedata');
const pkg = require('./package.json');

const defaults = {
  verbose: true,
  cacheEndpoint: false,
  hookEndpoint: false,
  userAgent: '',
  status: 'published',
  populatePage: 'project,parentPage',
  enablePageCache: false,
  enableProjectPagesCache: false,
  enableParentPagesCache: false,
  cache: {
    expiresIn: 1000 * 60 * 60 * 24 * 7, //1 week
    staleIn: 1000 * 60 * 60 * 23, //23 hours
    staleTimeout: 200,
    generateTimeout: 5000
  }
};

exports.register = function(server, options, next) {
  const config = hoek.applyToDefaults(defaults, options, true);

  const schema = Joi.object().keys({
    host: Joi.string().uri().required(),
    key: Joi.string().required(),
    status: Joi.string().allow(['drafts', 'published']),
    populatePage: Joi.string(),
    enablePageCache: Joi.boolean(),
    enableProjectPagesCache: Joi.boolean(),
    enableParentPagesCache: Joi.boolean(),
    cache: Joi.object().allow(null),
    cacheEndpoint: Joi.string().allow(false),
    hookEndpoint: Joi.string().allow(false),
    hookSuccessMethod: Joi.string().allow(null),
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
  require('./methods/getPageContent')(server, api, config);
  require('./methods/getProjectPages')(server, api, config);
  require('./methods/getParentPages')(server, api, config);
  require('./routes/hook')(server, api, config);

  next();
};

exports.register.attributes = {
  once: true,
  pkg
};
