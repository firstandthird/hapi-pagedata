const Hapi = require('hapi');
const port = process.env.PORT || 8080;

const server = new Hapi.Server({
  debug: {
    log: ['pagedata', 'error']
  }
});
server.connection({ port });

server.register({
  register: require('../'),
  options: {
    host: process.env.PAGEDATA_HOST,
    key: process.env.PAGEDATA_KEY,
    globalSlugs: ['global'],
    verbose: true
  }
}, (err) => {
  if (err) {
    throw err;
  }

  server.route({
    path: '/',
    method: 'GET',
    config: {
      plugins: {
        'hapi-pagedata': {
          pages: ['test-1', 'test-2']
        }
      }
    },
    handler: function(request, reply) {
      reply(request.pre);
    }
  });
  server.start((serverErr) => {
    if (serverErr) {
      throw serverErr;
    }
    console.log('Server started', server.info.uri);
  });
});

