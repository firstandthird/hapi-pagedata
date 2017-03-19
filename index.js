'use strict';
const hoek = require('hoek');
const Joi = require('joi');
const PageData = require('pagedata-api');
const pkg = require('./package.json');

const defaults = {
  tag: '',
  verbose: false,
  cacheEndpoint: false,
  hookEndpoint: false,
  userAgent: '',
  cache: {
    segment: 'pagedata',
    enabled: (process.env.NODE_ENV === 'production'),
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
    key: Joi.string(),
    tag: Joi.string().allow(''),
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
  const internal = {
    api,
    server,
    config
  };

  server.expose('api', api);

  const methodOptions = {};
  if (config.cache.enabled) {
    delete config.cache.enabled;
    methodOptions.cache = config.cache;
    methodOptions.generateKey = function(slug, tag) {
      if (!tag) {
        return slug;
      }
      return `${slug}_${tag}`;
    };
  }
  server.method('pagedata.getPage', require('./lib/method-get').bind(internal), methodOptions);
  server.method('pagedata.getPageContent', require('./lib/method-getcontent').bind(internal));

  if (config.cacheEndpoint) {
    server.route(require('./lib/routes-cache')(server, config, internal.cache));
  }
  if (config.hookEndpoint) {
    server.route(require('./lib/routes-hook')(server, config, internal.cache));
  }

  next();
};

exports.register.attributes = {
  once: true,
  pkg
};
