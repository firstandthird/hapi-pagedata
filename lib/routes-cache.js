'use strict';
const async = require('async');
module.exports = function(server, config) {
  return [
    {
      method: 'GET',
      path: config.cacheEndpoint,
      handler(request, reply) {
        reply(server.plugins['hapi-pagedata'].cache.stats);
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
          server.plugins['hapi-pagedata'].cache.drop(id, done);
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
