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
console.log("id", id);
console.log("url", url);

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

        console.log(body);
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

var queryDB = new Promise(function(resolve, reject){
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

  }).then(function(rows){
    console.log("rows from then", JSON.stringify(rows, null, 2));


  })

  ;
};

// console.log(rows);
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
