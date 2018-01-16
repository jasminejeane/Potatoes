const sqlite = require('sqlite'),
  sqlite3 = require('sqlite3').verbose(),
  Sequelize = require('sequelize'),
  request = require('request'),
  express = require('express'),
  app = express();
// getFilmRecommendations = require("./routes");

const {
  PORT = 3000, NODE_ENV = 'development', DB_PATH = './db/database.db'
} = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => {
    if (NODE_ENV === 'development') console.error(err.stack);
  });



// THIRD PARTY CONNECTION



// SQLITE CONNECTION
var db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the sqlite database.');
});






// ROUTES
app.get('/films/:id/recommendations',
  function(req, res, next) {

    // 5) handles invalid id
    // 6) handles invalid query params
    // correct recs first b4 these can pass
    // if(isNaN(req.params.id) || isNaN(req.query.limit) || isNaN(req.query.offset) ) {

    if (isNaN(req.params.id)) {
      var err = new Error("Not Found");
      err.status = 422;
      next(err);
    } else {
      next();
    }
  },
  getFilmRecommendations);



app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error Handler
// handles missing routes
app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  res.json({
    message: err.message
  });

});



// ROUTE HANDLER
function getFilmRecommendations(req, res) {


  var queryDB = new Promise(function(resolve, reject) {

      var offset = parseInt(req.query.offset, 10);
      if (offset < 1) {
        offset = 0;
      }

      var limit = parseInt(req.query.limit, 10);
      if (isNaN(limit)) {
        limit = 10;
      } else if (limit > 50) {
        limit = 50;
      } else if (limit < 1) {
        limit = 1;
      }



      let sql = `SELECT films.id, films.title, films.release_date,
            genres.name from films LEFT JOIN genres on
            (films.genre_id = genres.id)
            WHERE films.genre_id = (SELECT genre_id from films
            WHERE films.id = `;


      db.all(sql + req.params.id + ") LIMIT " + limit, [], (err, rows) => {


        var movieIDs = [];
        rows.forEach(function(item) {

          movieIDs.push(item.id);
        })
        resolve(movieIDs);

      }) // end db query
    })


    .then(function(ids) {


      var url = "https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=" + ids;




      request(url,
        function(error, response, body) {

          if (error) {
            console.error(error);
          }

          if (!error && response.statusCode === 200) {


            var body = JSON.parse(body);


            var reviews = [];

            for (var i = 0; i < body.length; i++) {

              reviews.push(body[i].reviews);

            }


            var groupRating = [];
            for (var i = 0; i < reviews.length;) {
              var rating = 0;
              for (var j = 0; j < reviews[i].length; j++) {

                rating += reviews[i][j].rating;
              }
              groupRating.push((rating / reviews[i].length).toFixed(1));
              i++
            }


            var yes = [];
            var joinAvg = {};


            groupRating.forEach(function(avg) {


              yes.push(avg);
            })

            for (var i = 0; i < ids.length; i++) {
              joinAvg[ids[i]] = yes[i];

            }

            var keys = [];
            for (var key in joinAvg) {
              if (joinAvg[key] > 3) {
                keys.push(key);
              }
            }
            return keys;

          }

        })

      var pizza = ['8134', '8141', '8216', '8306', '8369'];
      return pizza;
    }).then(function(keys) {

      var newKeys = keys.join(", ");

      let sql = `SELECT films.id, films.title, films.release_date,
            genres.name from films LEFT JOIN genres on
            (films.genre_id = genres.id)
            WHERE films.id IN ( `;


      // keys.forEach(function(key) {
        db.all(sql + newKeys + ")", [], (err, rows) => {


          res.json({
             recommendations: rows,
             meta: {
               limit: 10,
               offset: 1
             }
           });
        }) // end db query

      // }) // end forEach function
    })

    .catch(function(e) {

      console.error("There was an error", e);
    })


};


// https://gist.github.com/dalelane/6ce08b52d5cca8f92926
module.exports = app;
