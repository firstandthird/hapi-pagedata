'use strict';
const hoek = require('hoek');
const Joi = require('joi');
const PageData = require('pagedata');
const pkg = require('./package.json');

const defaults = {
  verbose: true,
  userAgent: '',
  status: 'published',
  pageCache: false,
  projectPagesCache: false,
  collectionPagesCache: false,
  timeout: 0,
  // example options for pageCache/projectPagesCache/collectionPagesCache:
  // {
  //   expiresIn: 1000 * 60 * 60 * 24 * 7, //1 week
  //   staleIn: 1000 * 60 * 60 * 23, //23 hours
  //   staleTimeout: 200,
  //   generateTimeout: 5000
  // }
};

const register = function(server, options) {
  const config = hoek.applyToDefaults(defaults, options, true);

  if (!config.userAgent) {
    config.userAgent = `hapi-pagedata/${pkg.version}`;
  }

  const api = new PageData(config.host, config.key, config.userAgent, config.timeout);

  server.expose('api', api);

  require('./methods/getPage')(server, api, config);
  require('./methods/getPageContent')(server, api, config);
  require('./methods/getProjectPages')(server, api, config);
  require('./methods/getCollectionPages')(server, api, config);
};


exports.plugin = {
  name: 'hapi-pagedata',
  register,
  once: true,
  pkg: require('./package.json')
};
