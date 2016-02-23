'use strict';
const hoek = require('hoek');
const Joi = require('joi');

const defaults = {
  globalSlugs: null,
  env: 'dev',
  cacheEndpoint: '/pagedata',
  verbose: false,
  cache: {
    expiresIn: 1000 * 60 * 60 * 24, //1 day
    staleIn: 1000 * 60 * 60, //1 hour
    staleTimeout: 200,
    generateTimeout: 5000
  }
};

exports.register = function(server, options, next) {
  const config = hoek.applyToDefaults(defaults, options, true);

  const schema = Joi.object().keys({
    host: Joi.string().uri().required(),
    key: Joi.string(),
    globalSlugs: Joi.array().allow(null),
    env: Joi.string(),
    cache: Joi.object().allow(null),
    cacheEndpoint: Joi.string(),
    verbose: Joi.boolean()
  });

  const validation = schema.validate(config);
  if (validation.error) {
    return next(validation.error);
  }

  const internal = {
    server,
    config
  };

  const methodOptions = {};
  if (config.cache) {
    methodOptions.cache = config.cache;
  }
  server.method('pageData.get', require('./lib/method').bind(internal), methodOptions);

  server.ext('onPreHandler', require('./lib/pre-handler').bind(internal));

  if (config.cacheEndpoint) {
    server.route(require('./lib/routes')(server, config));
  }
  next();
};

exports.register.attributes = {
  once: true,
  pkg: require('./package.json')
};
