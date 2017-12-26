/* eslint strict: 0, max-len: 0, prefer-arrow-callback: 0 */
'use strict';
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = require('code').expect;
const Hapi = require('hapi');
const pkg = require('../package.json');

let server;
let mockServer;

lab.beforeEach(async() => {
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

lab.afterEach(async() => {
  await server.stop();
  await mockServer.stop();
});

lab.test('exposes api and instantiates it with correct options', async() => {
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
  expect(typeof server.api).to.equal('object');
  expect(server.api.options).to.equal({
    host: 'http://localhost:8080',
    key: 'key',
    verbose: true,
    timeout: 800,
    userAgent: `theApp pagedata-api/${pkg.version}`
  });
});
