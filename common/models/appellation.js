module.exports = function (Appellation) {

  Appellation.getByPosition = function (shopId, cb) {
    Appellation.find(position, function (err, instance) {
      response = "Position" + instance.name;
      cb(null, response);
      console.log(response);
    });
  };

  Appellation.updateGeoJSON = function (cb) {
    require("./../../lib_node_modules/github2mongo").fetchGeoJSONFromGithub2Mongo(cb);
  };

  Appellation.remoteMethod(
    'getByPosition',
    {
      http   : {path: '/getByPosition', verb: 'get'},
      returns: {arg: 'position', type: 'geo'}
    },
    'updateGeoJSON',
    {
      http   : {path: '/updateGeoJSON', verb: 'get'},
      returns: {arg: 'result', type: 'string'}
    }
  );
};
