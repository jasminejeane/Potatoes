'use strict';

var express = require("express"),
    app = express(),
    sqlite3 = require('sqlite3').verbose(),
    routes = require("./routes"),
    request = require("request"),

    // parse the req body as json and make it accessible from the req.body property
    jsonParser = require("body-parser").json;




    // middleware app.use

    // status codes for api responses
    app.use(jsonParser());


    var db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the sqlite database.');
    });

    // db.serialize(() => {
    //   db.each(`SELECT PlaylistId as id,
    //                   Name as name
    //            FROM playlists`, (err, row) => {
    //     if (err) {
    //       console.error(err.message);
    //     }
    //     console.log(row.id + "\t" + row.name);
    //   });
    // });

    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Close the database connection.');
    });



    app.use("/", routes);

    app.use(function(req, res, next){
      var err = new Error("Not Found");
      err.status = 404;
      next(err);
    })


    app.use(function(err, req, res, next){
      res.status(err.status || 500);
      res.json({
        error: {
          message: err.message
        }
      })

    });





request("https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=8", function(error, response, body) {

  // If the request is successful (i.e. if the response status code is 200)
  if (!error && response.statusCode === 200) {

    // Parse the body of the site
    console.log("movie: " + JSON.parse(body));
  }
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
	console.log("Express server is listening on port", port);
});
