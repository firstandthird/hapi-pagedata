/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Hapi = require('hapi');
const pkg = require('../package.json');
const tap = require('tap');
let server;
let mockServer;

tap.beforeEach(async() => {
  server = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8081
  });
  mockServer = new Hapi.Server({
    debug: { log: ['error', 'info', 'hapi-pagedata'], request: ['error'] },
    port: 8080
  });
  await mockServer.start();
});

tap.afterEach(async() => {
  await server.stop();
  await mockServer.stop();
});

tap.test('exposes api and instantiates it with correct options', async(t) => {
  await server.register({
    plugin: require('../'),
    options: {
      host: 'http://localhost:8080',
      key: 'key',
      verbose: true,
      timeout: 800,
      appName: 'theApp'
    }
  });
  await server.start();
  t.equal(typeof server.api, 'object', 'adds the pagedata API to the server');
  t.deepEqual(server.api.options, {
    appName: 'theApp',
    getCollectionPages: false,
    host: 'http://localhost:8080',
    key: 'key',
    pageCache: false,
    projectPagesCache: false,
    status: 'published',
    timeout: 800,
    userAgent: `theApp hapi-pagedata/${pkg.version}`,
    verbose: true
  }, 'configures the pagedata API correctly');
  t.equal(typeof server.api.getPage, 'function', 'API provides the getPage method');
  t.equal(typeof server.api.getPages, 'function', 'API provides the getPages method');
  t.equal(typeof server.api.getProjects, 'function', 'API provides the getProjects method');
  await server.stop();
  t.end();
});
