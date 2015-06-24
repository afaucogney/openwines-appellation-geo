module.exports = function (Appellation) {
  Appellation.getByPosition = function (shopId, cb) {
    Appellation.find(position, function (err, instance) {
      response = "Position" + instance.name;
      cb(null, response);
      console.log(response);
    });
  };
  Appellation.remoteMethod(
    'getByPosition',
    {
      http   : {path: '/getByPosition', verb: 'get'},
      returns: {arg: 'position', type: 'geo'}
    }
  );
};
