var mongoose = require("mongoose");
var payment = mongoose.model("payment1");
var apiOptions = {
    server: "http://localhost:3000"
  }
module.exports.savePop=function(request,response)
{
    var select_seats=request.body.seat; 
    globalString=request.params.movie_title;
    var data ={'value':select_seats};
    globalString += select_seats;
    //globalString += " world";
    console.log(globalString);
   // response.redirect('/cinemalist.html/:'+select_seats,200);
}
module.exports.nothing = function(req, res) {
    
    res.render("pop");
};