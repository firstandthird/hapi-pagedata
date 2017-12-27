'use strict';
const PageData = require('pagedata');
const pkg = require('./package.json');

const register = function(server, pluginOptions) {
  // set the userAgent for the pagedata-api:
  pluginOptions.userAgent = `${pluginOptions.appName} hapi-pagedata/${pkg.version}`;
  delete pluginOptions.appName;

  const api = new PageData(pluginOptions);
  server.decorate('server', 'api', api);
};


exports.plugin = {
  name: 'hapi-pagedata',
  register,
  once: true,
  pkg: require('./package.json')
};
