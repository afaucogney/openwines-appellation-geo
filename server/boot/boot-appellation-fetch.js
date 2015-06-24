module.exports = function (app, cb) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */

  if (process.env.UPDATE_GEOJSON_FROM_GITHUB === 1) {

    //app.models.Appellation.find(function (err, appellations) {
    //  appellations.forEach(function (appellation) {
    //    console.log(appellation);
    //
    //  })
    //
    //
    //  //return cb;
    //});

    //app.models.Appellation.getDataSource().connector.connect(function (err, db) {
    //  var collection = db.collection('Appellation');
    //  //var author = Book.getDataSource().ObjectID(authorId);
    //  collection.aggregate([
    //    {$unwind: "$features"}
    //    //{$match: {authorId: author}},
    //    //{
    //    //  $group: {
    //    //    _id  : authorId,
    //    //    total: {$sum: "$price"}
    //    //  }
    //    //}
    //  ], function (err, data) {
    //    if (err)
    //      return cb(err);
    //    console.log(data);
    //    return cb(null, data);
    //  });
    //});
    //
    //var XaddGeoJson = function (object) {
    //  app.models.Appellation.getDataSource().connector.connect(function (err, db) {
    //    var collection = db.collection('Appellation');
    //    //var author = Book.getDataSource().ObjectID(authorId);
    //    console.log(object);
    //    collection.insert(JSON.parse(object)
    //      //collection.aggregate([
    //      //  {$unwind: "$features"}
    //      //  //{$match: {authorId: author}},
    //      //  //{
    //      //  //  $group: {
    //      //  //    _id  : authorId,
    //      //  //    total: {$sum: "$price"}
    //      //  //  }
    //      //  //}
    //      //]
    //      , function (err, data) {
    //        if (err) {
    //          console.log(err);
    //          return cb(err);
    //        }
    //        console.log(data);
    //        return cb(null, data);
    //      });
    //  });
    //
    //}

    var cheerio = require("cheerio");
    var request = require("request");
    var async = require("async");
    var url = "https://github.com/OpenWines/Open-Data/tree/master/dept_44";

    var mongodb = require('mongodb');

    var MONGODB_URI = "mongodb://anthony:guignols@ds043997.mongolab.com:43997/openwines-appellation-geoloc";

    var OpenWinesDB;
    var Appellations;

// Initialize connection once

    mongodb.MongoClient.connect(MONGODB_URI, function (err, database) {
      if (err) throw err;

      OpenWinesDB = database;
      Appellations = OpenWinesDB.collection('Appellation');

    });


    //app.get('/', function(req, res) {
    //
    //  // BAD! Creates a new connection pool for every request
    //
    //  mongodb.MongoClient.connect(MONGODB_URI, function(err, db) {
    //    if(err) throw err;
    //
    //    var coll = db.collection('test');
    //
    //    coll.find({}, function(err, docs) {
    //      docs.each(function(err, doc) {
    //        if(doc) {
    //          res.write(JSON.stringify(doc) + "\n");
    //        }
    //        else {
    //          res.end();
    //        }
    //      });
    //    });
    //  });
    //});


    if (typeof String.prototype.endsWith !== 'function') {
      String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
      };
    }

    var XgetGeoJSONurl = function () {
      request({
          method: 'GET',
          url   : url
        }, function (err, response, body) {
          if (err) return console.error(err);

          // Tell Cherrio to load the HTML
          var $ = cheerio.load(body);

          //$('table.files').each(function () {
          //  var href =

          $('a.js-directory-link').each(function (i, elem) {
            var elemUrl = elem.attribs.href;
            if (elemUrl.endsWith(".geojson")) {
              var rawGitUrl = "https://rawgit.com"; //https://raw.githubusercontent.com/
              elemUrl = elemUrl.replace("\/blob\/", "\/");
              console.log(elemUrl)
              var geoJsonUrl = rawGitUrl + elemUrl;
              //console.log(elem.attribs.href);


              request({
                method: 'GET',
                url   : geoJsonUrl
              }, function (err, response, body) {

                addGeoJson(body);
                //console.log(geoJsonUrl);
                //console.log(body);
              });
            }
          });

          //<table class="files"
          //.each(function(b) {
          //console.log(href);
          //var href = $('a.js-directory-link', this).attr('href');
          //console.log(href);
          //if (href.lastIndexOf('/') > 0) {
          //  console.log($('h3', this).text());
          //}
          //});
          process.nextTick(cb);
        }
      );
    };

    var getGeoJSONurl = function (callback) {
      console.log("GET ");
      console.log(url);
      request({
          method: 'GET',
          url   : url
        }, function (err, response, body) {
          if (err) return console.error(err);

          // Tell Cherrio to load the HTML
          var $ = cheerio.load(body);

          var geoJSONurls = [];

          $('a.js-directory-link').each(function (i, elem) {
            var elemUrl = elem.attribs.href;
            if (elemUrl.endsWith(".geojson")) {
              var rawGitUrl = "https://rawgit.com"; //https://raw.githubusercontent.com/
              elemUrl = elemUrl.replace("\/blob\/", "\/");
              //console.log(elemUrl)
              var geoJsonUrl = rawGitUrl + elemUrl;
              geoJSONurls.push(geoJsonUrl);
            }
          });

          callback(null, geoJSONurls);
        }
      );
    };

    var getRawGeoJSONs = function (urls, callback) {
      console.log("STEP2");
      console.log(urls);
      var geoJSONobjects = [];
      var urlsSize = urls.length;
      var urlParsed = urlsSize;

      async.each(urls, function (geoJSONUrl, cb) {

        request({
          method: 'GET',
          url   : geoJSONUrl
        }, function (err, response, body) {
          urlParsed--;
          console.log("+ " + urlParsed + " out of " + urlsSize + " + " + geoJSONUrl);
          if (body != "" && body != null)
            geoJSONobjects.push(JSON.parse(body));
          cb();
        });

      }, function (err) {
        if (err)
          console.log(err);
        else
          callback(null, geoJSONobjects);
      });
      //urls.forEach(function (geoJsonUrl) {
      //  request({
      //    method: 'GET',
      //    url   : geoJsonUrl
      //  }, function (err, response, body) {
      //    geoJSONobjects.push(JSON.parse(body));
      //  });
      //});
      //  callback(null, geoJSONobjects);
    };

    var getRawGeoJSON = function (geoJSONUrl, callback) {
      console.log("GET RAW JSON:" + geoJSONUrl);
      request({
        method: 'GET',
        url   : geoJSONUrl
      }, function (err, response, body) {

        // console.log("+ " + urlParsed + " out of " + urlsSize + " + " + geoJSONUrl);
        //   if (body != "" && body != null)
        callback(null, JSON.parse(body));

      });
      //
      //}, function (err) {
      //  if (err)
      //    console.log(err);
      //
      //});
      //urls.forEach(function (geoJsonUrl) {
      //  request({
      //    method: 'GET',
      //    url   : geoJsonUrl
      //  }, function (err, response, body) {
      //    geoJSONobjects.push(JSON.parse(body));
      //  });
      //});
      //  callback(null, geoJSONobjects);
    };


    var pushToMongo = function (geoJSONobjects, callback) {
      console.log("PUSH TO MONGO");
      //console.log(geoJSONobjects);
      //app.models.Appellation.getDataSource().connector.connect(function (err, db) {
      //  var collection = db.collection('Appellation');


      //async.map(geoJSONobjects, collection.insert, function (err, data) {
      // results is now an array of stats for each file
      //});

      Appellations.insert(geoJSONobjects, function (err, data) {
          if (err) {
            console.log(err);
            callback(err);
          }
          urlParsed--;
          console.log("+ " + urlParsed + " out of " + urlsSize + " + ");
          //console.log(data);
          callback(null, data);

        }
      )
      ;
      //});
    };

    var getAndPushSingle = function (url, cb) {
      console.log("GET AND PUSH:" + url);
      async.waterfall([
        async.apply(getRawGeoJSON, url),
        pushToMongo
      ], function (err, result) {
        // result now equals 'done'
        //console.log(result);
        cb(null, result);
      });
    };

    var urlsSize;
    var urlParsed;

    var getAndPushRawGeoJSON = function (urls, callback) {
      console.log("GET AND PUSH ALLS");
      console.log(urls);
      urlsSize = urls.length;
      urlParsed = urlsSize;


      async.mapLimit(urls, 1, getAndPushSingle, function (err, results) {
        // results is now an array of stats for each file
        console.log(results)
      });


    };


    //async.waterfall([
    //  getGeoJSONurl,
    //  getRawGeoJSON,
    //  pushToMongo
    //], function (err, result) {
    //  // result now equals 'done'
    //  console.log(result);
    //  cb();
    //});


    async.waterfall([
      getGeoJSONurl,
      getAndPushRawGeoJSON
    ], function (err, result) {
      // result now equals 'done'
      console.log(result);
      cb();
    });

  }

// app.datasources.openwines - appellation - geo - db.
//process.nextTick(cb); // Remove if you pass `cb` to an async function yourself
}

