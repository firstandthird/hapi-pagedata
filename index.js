'use strict';
const Joi = require('joi');
const PageData = require('pagedata');
const pkg = require('./package.json');

const register = function(server, pluginOptions) {
  const config = Joi.validate(pluginOptions, {
    host: Joi.string(),
    key: Joi.string(),
    appName: Joi.string(),
    verbose: Joi.boolean().default(true),
    userAgent: Joi.string().default(`${pluginOptions.appName} hapi-pagedata/${pkg.version}`),
    status: Joi.string().default('published'),
    pageCache: Joi.boolean().default(false),
    projectPagesCache: Joi.boolean().default(false),
    getCollectionPages: Joi.boolean().default(false),
    timeout: Joi.number().default(0),
  });

  const api = new PageData(config);

  server.decorate('server', 'api', api);
};


exports.plugin = {
  name: 'hapi-pagedata',
  register,
  once: true,
  pkg: require('./package.json')
};
