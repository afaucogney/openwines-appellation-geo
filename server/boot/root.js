module.exports = function(server) {

  var hostName = "openwines-appellation-geoloc.herokuapp.com";
  require("heroku-alive").startKeepAlive(20, hostName, 80);

  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
};
