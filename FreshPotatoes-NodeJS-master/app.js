'use strict';

var express = require("express"),
    app = express(),
    routes = require("./routes"),
    request = require("request"),

    jsonParser = require("body-parser").json;








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
