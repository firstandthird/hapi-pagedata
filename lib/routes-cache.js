'use strict';
const async = require('async');
module.exports = function(server, config) {
  return [
    {
      method: 'GET',
      path: config.cacheEndpoint,
      handler(request, reply) {
        reply(request.server.methods.pagedata.getPage.cache.stats);
      }
    },
    {
      method: 'DELETE',
      path: config.cacheEndpoint,
      handler(request, reply) {
        const ids = (request.query.id) ? request.query.id.split(',') : [];
        if (ids.length === 0) {
          return reply('id required').code(400);
        }

        async.each(ids, (id, done) => {
          server.log(['pagedata', 'cache', 'drop'], `${id} dropped from cache`);
          request.server.methods.pagedata.getPage.cache.drop(id, done);
        }, (err) => {
          if (err) {
            return reply(err);
          }
          reply('ok');
        });
      }
    }
  ];
};
