'use strict';

const async = require('async');

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

  const response = request.response;
  if (!response || typeof response.source !== 'object' || pages.length === 0) {
    return reply.continue();
  }

  if (!response.source.context) {
    response.source.context = {};
  }
  response.source.context.pageData = {};

  async.map(pages, (page, done) => {
    server.methods.pageData.get(page, done);
  }, (err, results) => {
    results.forEach((value, index) => {
      const key = pages[index];
      response.source.context.pageData[key] = value;
    });

    reply.continue();
  });
};
