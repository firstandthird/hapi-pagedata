/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const Hoek = require('hoek');
const expect = require('code').expect;
const Hapi = require('hapi');
const EOL = require('os').EOL;

lab.experiment('specs', () => {
  const server = new Hapi.Server({
    debug: { request: '*', log: 'hapi-views' }
  });
  server.connection({ port: 8080 });
  const port = 8080;
  lab.before(start => {
    server.register({
      register: require('../'),
      options: {
        host: `http://localhost:${port}`,
        key: 'key',
        cacheEndpoint: '/cache',
        hookEndpoint: '/hook',
        //globalSlugs: ['global'],
        verbose: true,
        site: 'site',
        tag: 'test'
      }
    }, (err) => {
      server.start((err) => {
        Hoek.assert(!err, err);
        start();
      });
    });
  });
  // tests
  lab.test('yo ', done => {
    server.inject({
      url: '/yaml'
    }, response => {
      const context = response.request.response.source.context;
      expect(context).to.equal({
        api: {},
        method: {},
        inject: {},
        yaml: {
          test1: 'true'
        }
      });
      done();
    });
  });
});
