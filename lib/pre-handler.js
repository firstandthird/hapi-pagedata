'use strict';

const async = require('async');
const yaml = require('js-yaml');

module.exports = function(request, reply) {
  const config = this.config;
  const server = this.server;
  let pages = [];

  if (config.globalSlugs) {
    pages = pages.concat(config.globalSlugs);
  }
  const pluginConfig = request.route.settings.plugins['hapi-pagedata'];
  if (pluginConfig && pluginConfig.pages) {
    pages = pages.concat(pluginConfig.pages);
  }

  if (pages.length === 0) {
    return reply.continue();
  }

  request.pre.pageData = {};

  async.map(pages, (page, done) => {
    server.methods.pageData.get(page, done);
  }, (err, results) => {
    results.forEach((value, index) => {
      const key = pages[index];
      const json = yaml.safeLoad(value);
      request.pre.pageData[key] = json;
    });

    reply.continue();
  });
};
