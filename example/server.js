/* eslint-disable no-console */
const Hapi = require('hapi');
const port = process.env.PORT || 8080;

const server = new Hapi.Server({
  debug: {
    log: ['pagedata', 'error', 'cache']
  }
});
server.connection({ port });

server.register({
  register: require('../'),
  options: {
    host: process.env.PAGEDATA_HOST,
    key: process.env.PAGEDATA_KEY,
    env: 'dev',
    cacheEndpoint: '/cache',
    hookEndpoint: '/hook',
    globalSlugs: ['global'],
    verbose: true
  }
}, (err) => {
  if (err) {
    throw err;
  }

  server.method('test', (cb) => {
    setTimeout(() => {
      cb(null, { pre: true });
    }, 500);
  });

  server.route({
    path: '/',
    method: 'GET',
    config: {
      pre: [
        { method: 'test()', assign: 'test' }
      ],
      plugins: {
        'hapi-pagedata': {
          pages: ['test-1', 'test-2']
        }
      }
    },
    handler(request, reply) {
      reply(request.pre);
    }
  });

  server.start((serverErr) => {
    if (serverErr) {
      throw serverErr;
    }
    //server.methods.pageData.set('test-1', { blah: true });
    console.log('Server started', server.info.uri);
  });
});

