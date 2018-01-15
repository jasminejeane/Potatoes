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


function thirdPartyReq(id) {
  var url = "https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=" + id;
  // console.log("id", id);
  // console.log("url", url);

  request(url,
    function(error, response, body) {

      if (error) {
        console.error(error);
      }

      var reviews,
        average = 0,
        newAverage;
      // If the request is successful (i.e. if the response status code is 200)
      if (!error && response.statusCode === 200) {

        // console.log(body);
        reviews = JSON.parse(body)[0].reviews;
        // criteria -  A minimum of 5 reviews
        if (reviews.length >= 5) {

          for (var i = 0; i < reviews.length; i++) {

            average += reviews[i].rating;
          }
          newAverage = average / reviews.length;
          console.log("average before if greater: ", newAverage.toFixed(1));

        }

        // criteria -  greater than 4.0
        // criteria -  number of reviews
        if (newAverage > 4.0) {
          console.log("average", newAverage.toFixed(1));
          console.log("number of reviews", reviews.length)

        }
      }
    })
}


// THIRD PARTY CONNECTION



// SQLITE CONNECTION
var db = new sqlite3.Database('./db/database.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the sqlite database.');
});






// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// express middleware optional params
// or another route for the limit and offset


// 1. grab all genres associated with input id [check]
// (then) iterate through all returned items
// for in --- and run the thrid part function on each
// if passes third part tests
// res.json those films
// add average and #reviews to res.json

// ROUTE HANDLER
function getFilmRecommendations(req, res) {

  thirdPartyReq(req.params.id);
  // console.log("newAverage", newAverage);

  var queryDB = new Promise(function(resolve, reject) {
    let sql = `SELECT films.id, films.title, films.release_date,
            genres.name from films LEFT JOIN genres on
            (films.genre_id = genres.id)
            WHERE films.genre_id = (SELECT genre_id from films
            WHERE films.id = `;


    db.all(sql + req.params.id + ')', [], (err, rows) => {
      // process rows here
      if (err) {
        throw err;
      }
      // console.log("req Param works", JSON.stringify(rows, null, 2));
      resolve(rows);
      // res.json({
      //   recommendations: rows
      // });
    })

  }).then(function(rows) {
    // console.log("rows from then", JSON.stringify(rows, null, 2));
    var movieIDs = []
    rows.forEach(function(item) {

      movieIDs.push(item.id);
    })
    return movieIDs;
  }).then(function(ids) {


    var url = "https://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=" + ids;


    request(url,
      function(error, response, body) {

        if (error) {
          console.error(error);
        }

        // var reviews,
        //   average = 0,
        //   newAverage;
        // If the request is successful (i.e. if the response status code is 200)
        if (!error && response.statusCode === 200) {


          var body = JSON.parse(body);


          // entire review body
          var reviews = [];
          body.forEach(function(item) {

            reviews.push(item.reviews);
          });

          var newSet = []
          // each movie review set
          for (var i = 0; i < reviews.length; i++) {
            // this gives me the set of reviews for each movie
            // adding .length gives length of each movie
            // console.log("reviews ids", reviews[i]);
            if (reviews[i].length >= 5) {
              newSet.push(reviews[i]);
            }
            // another forEach on each reviews[i]
            // console.log("reviews rating", );
          }

          // console.log("newSet", newSet[0][0].id);
          // calculating ratings\

          var groupRating = [];
          for (var i = 0; i < newSet.length;) {
            var rating = 0;
            for (var j = 0; j < newSet[i].length; j++) {

              rating += newSet[i][j].rating;
            }
            // console.log("rating total", rating);
            groupRating.push((rating / newSet[i].length)toFixed(1));
            i++
          }

          console.log("rating total", groupRating);

          // expected output: 10
          // for each film [array returned from movieIDs] in body
          //
          // reviews.forEach(function(review){
          //   console.log("rating", review[1]);
          // })
          // console.log("reviews", typeof reviews);
          //   reviews = JSON.parse(body)[0].reviews;
          //   // criteria -  A minimum of 5 reviews
          //   if (reviews.length >= 5) {
          //
          //     for (var i = 0; i < reviews.length; i++) {
          //
          //       average += reviews[i].rating;
          //     }
          //     newAverage = average / reviews.length;
          //     console.log("average before if greater: ", newAverage.toFixed(1));
          //
          //   }
          //
          //   // criteria -  greater than 4.0
          //   // criteria -  number of reviews
          //   if (newAverage > 4.0) {
          //     console.log("average", newAverage.toFixed(1));
          //     console.log("number of reviews", reviews.length)
          //
          //   }
        }
      })
  }).catch(function(e) {

    console.error("There was an error", e);
  })


};

// res.status(200).json({
//
//   recommendations: "You sent me a GET request - 200",
//   response: rows,
//
//
// })
// res.status(500).send('Not Implemented');
// https://gist.github.com/dalelane/6ce08b52d5cca8f92926
module.exports = app;
