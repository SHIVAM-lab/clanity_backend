var express=require("express");
var multer =require('multer');
var path   =require('path');
var mongoose=require("mongoose");
var passport=require("passport");
var bodyParser=require("body-parser");
var crypto = require('crypto');
//var cors = require('cors'); 
require("dotenv").config();
//const cookieSession = require('cookie-session');
//var fileUpload = require('express-fileupload');
//const { getVideoDurationInSeconds } = require('get-video-duration')
const $=require('jquery')
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var chalk = require('chalk');
var methodOverride = require('method-override');
require("./passport-setup");
var User=require("./models/user");
var Campground=require("./models/info");
var Campground2=require("./models/question");
var Comment=require("./models/comment");
var Edit=require("./models/edit");
var Privacy=require("./models/privacy_settings");
var Upload=require("./models/upload");
var Post=require("./models/post");
var Message=require("./models/message");
var morgan=require("morgan");
var LocalStrategy= require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
const { render } = require("ejs");
const post = require("./models/post");
const router = require("./routes/posts_get");
const url="mongodb://localhost:27017/clanity2";
 mongoose.connect(url,{
	useNewUrlParser: true,
	useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const cookie_Parser=require('cookie-parser')
const cookie_Session=require('cookie-session');

var app= express();
app.set('view engine','ejs');
app.use(cookie_Parser())
var server = app.listen(5000, function() { 
	console.log('Yelpcamp listening on port 5000'); 
  });


const io = require('socket.io').listen(server);


app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(express.static(__dirname+"/public"));


app.use(bodyParser.urlencoded({extended:true}));

// app.use(require("express-session")({
//  	secret: "Rusty is the cutest dog in the world",
//  	resave: false,
//  	saveUninitialized: false
//  }));

 app.use(cookie_Session({
     name: 'tuto-session',
     keys: ['key1', 'key2']
   }))

app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


////////////////////////////////////////////
//===================
//ROUTES
//===================

// app.get("/secret/account_settings",isLoggedIn,(req,res)=>{
// 	res.render("account_settings");
// })

// app.get("/secret/privacy-settings",isLoggedIn,(req,res)=>{
// 	res.render("privacy-settings");
// })

app.get("/secret/topic-preferences",isLoggedIn,(req,res)=>{
	res.render("topic-preferences");
})

app.get("/",function(req,res){
	res.render("home");
});

Grid.mongo = mongoose.mongo;
const conn = mongoose.connection;
let gfs, gridFSBucket;
conn.once("open", () => {
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "upload"
  });
  gfs = Grid(conn.db);
  gfs.collection("upload");
    console.log(
    chalk.yellow(
      "[!] The database connection opened successfully in GridFS service"
    )
  );
});

var storage = new GridFsStorage({
	url: "mongodb://localhost:27017/clanity2",
	options: {useUnifiedTopology: true},
	file: (req, file) => {
	  return new Promise((resolve, reject) => {
		crypto.randomBytes(16, (err, buf) => {
		  if (err) {
			return reject(err);
		  }
		  const filename = buf.toString('hex') + path.extname(file.originalname);
		  const fileInfo = {
			filename: filename,
			metadata: mongoose.Types.ObjectId(req.user._id),
			bucketName: 'upload'
		  };
		  resolve(fileInfo);
		});
	  });
	}
});

const upload = multer({ storage });
var imageF = Post.find({});

//posts
app.use('/post',require('./routes/posts_get'));

app.use('/post',require('./routes/posts_post'));



//video
app.use('/',(require('./routes/video_post')));

app.use('/',require('./routes/video_get'))





/*end of upload*/

/////////////////
//friend request//////
app.get("/secret/friend",(req,res)=>{
	res.redirect("secret")
})

app.get("/secret/cancelrequest",(req,res)=>{
	res.redirect("secret")
})

app.get("/secret/accept",(req,res)=>{
	res.redirect("secret")
})

app.post("/secret/friend",(req,res)=>{
	var friend_request = mongoose.Types.ObjectId(req.body.request);
	var sender = mongoose.Types.ObjectId(req.user._id);	
	
	Edit.findOne({key:friend_request},function(err,message){
		console.log(message);
			if(err)
				{
					console.log("err in friend request");
				}

			else{
				if (Array.isArray(message.request)) {
					message.request.push({"buddy":sender,"status":"pending"});
				}
				else{
					message.request = [{"buddy":sender,"status":"pending"}];
				}

				
			}

			message.save(function(err,data){
				if(err){
					console.log("error likes in post");
				}
			})
		})

	

		Edit.findOne({key:sender},function(err,message){
			console.log(message);
				if(err)
					{
						console.log("err in friend request");
					}
	
				else{
					if (Array.isArray(message.request)) {
						message.request.push({"buddy":friend_request,"status":"sent"});
					}
					else{
						message.request = [{"buddy":friend_request,"status":"sent"}];
					}
	
					
				}
	
				message.save(function(err,data){
					if(err){
						console.log("error likes in post");
					}
					else{
						res.redirect("/secret");
					}
				})
		})
	})

	app.post("/secret/cancelrequest",(req,res)=>{
		var friend_request = mongoose.Types.ObjectId(req.body.request);
		var sender = mongoose.Types.ObjectId(req.user._id);	
		
		Edit.findOne({key:sender},function(err,message){
			console.log(message);
				if(err)
					{
						console.log("err in friend request");
					}
	
				else{
					for(var i=0;i<message.request.length;i++){
						if((message.request[i].buddy).toString() == (friend_request).toString()){
							message.request[i].remove();
							break;
							
						}
						
					}
										
				}
	
				message.save(function(err,data){
					if(err){
						console.log("error likes in post");
					}
				})
			})
	
		
	
			Edit.findOne({key:friend_request},function(err,message){
				console.log(friend_request + " " + sender);
					if(err)
						{
							console.log("err in friend request");
						}
		
					else{

						for(var i=0;i<message.request.length;i++){
							console.log(i);
							if((message.request[i].buddy).toString() == (sender).toString()){
								console.log("2");
								message.request[i].remove();
								console.log("3");
								break;
								
							}
							else{
								console.log(message.request[i].buddy)
							}
						}
	
					}
		
					message.save(function(err,data){
						if(err){
							console.log("error likes in post");
						}
						else{
							res.redirect("/secret");
						}
					})
			})
		})

	
			app.post("/secret/accept",(req,res)=>{
				var friend_request = mongoose.Types.ObjectId(req.body.request);
				var sender = mongoose.Types.ObjectId(req.user._id);	
				
				Edit.findOne({key:sender},function(err,message){
					console.log(message);
						if(err)
							{
								console.log("err in friend request");
							}
			
						else{
							for(var i=0;i<message.request.length;i++){
								if((message.request[i].buddy).toString() == (friend_request).toString()){
									message.request[i].remove();
									message.request.push({"buddy":friend_request,"status":"accepted"});
									break;
									
								}
								
							}
												
						}
			
						message.save(function(err,data){
							if(err){
								console.log("error likes in post");
							}
						})
					})
			
				
			
					Edit.findOne({key:friend_request},function(err,message){
						console.log(friend_request + " " + sender);
							if(err)
								{
									console.log("err in friend request");
								}
				
							else{
		
								for(var i=0;i<message.request.length;i++){
									console.log(i);
									if((message.request[i].buddy).toString() == (sender).toString()){
										message.request[i].remove();
										message.request.push({"buddy":sender,"status":"accepted"});
										break;
										
									}
									else{
										console.log(message.request[i].buddy)
									}
								}
			
							}
				
							message.save(function(err,data){
								if(err){
									console.log("error likes in post");
								}
								else{
									res.redirect("/secret");
								}
							})
					})
				})



app.get("/secret/message",isLoggedIn,function(req,res){
	Campground.find({key:req.user._id},function(err,data){
		if(err){
			console.log("error in message section");
		}
		else{
			
			data.map(file=>{
				console.log(data);
				console.log(file);	
				res.render("message",{ dat : file , currentUser:req.user})
			})
			
		}
	})
})


app.get("/secret/search",function(req,res){
	res.render("secret");
})

app.post("/secret/search",function(req,res){

	var usd = req.body.sea;
	console.log(usd);	
	Edit.find({name:usd},function(err,data){
		if(err)
			{
				console.log(err);
			}else{
				data.map(file=>{
					console.log(file);
					res.render("secret",{currentUser:req.user, sohom:file});
				})
				
				
			}
	})
});
//////////////////////////////////////////////////
////////message//////


app.get("/message/person/:id",isLoggedIn,(req,res)=>{
	console.log("yy+ message" + req.params.id);
	res.render("diff",{ dat : req.params.id});

	var friend_request = req.params.id;
	var sender = req.user._id;


	
io.on('connection',(socket)=>{
	console.log("connecting tttttttttttttttttttttt....." + socket.id);
	
	(Campground.findOne({key:sender},function(err,chat){
		if(err){
			console.log("error in chats");
			console.log(chat);
		}
		socket.emit('output',chat.messages);
	}))

    let fun = function(data){
		let message = data.message;
			io.emit('output',[data])
	
		console.log(friend_request);
		Campground.findOne({key:friend_request},function(err,mess){
				if(err)
					{
						console.log("err in friend request");
					}
	
				else{
					if (Array.isArray(message.request)) {
						mess.messages.push({"from":sender,"message":message});
					}
					else{
						mess.messages.push({"from":sender,"message":message});
					}
	
					
				}
	
				mess.save(function(err,data){
					if(err){
						console.log("error likes in post" + err);
					}
				})
			})
	
		
	
			Campground.findOne({key:sender},function(err,mess){
					if(err)
						{
							console.log("err in friend request");
						}
		
					else{
						if (Array.isArray(message.request)) {
							mess.messages.push({"from":sender,"message":message});
						}
						else{
							mess.messages.push({"from":sender,"message":message});
						}
		
						
					}
		
					mess.save(function(err,data){
						if(err){
							console.log("error likes in post" + err);
						}
						
					})
			})

			
		}

	 socket.on('input',fun);
	
	//


socket.on("disconnect",()=>{
	console.log(socket.id+" got disconnecteddddddddddddddddddddddddd");
	socket.removeAllListeners();
})

})

})






//edits
app.use('/',require('./routes/edit'))

app.use('/',require('./routes/edit'))

app.use('/',require('./routes/edit'))

//account_settings
app.use('/',require('./routes/account_settings'));

//privacy_settings
app.use('/',require('./routes/privacy_setting'))

//history
app.use('/',require('./routes/history'))

//home
app.use('/',require('./routes/home'))

//AUTH ROUTES
//DONE
app.use('/',(require('./routes/registerauth')))

app.use('/',require('./routes/loginauth'))

app.use('/',require('./routes/password_reset'))

///new question section
const bodyparser=require('body-parser');
const bodyparserurl=bodyparser.json();
var middleware=require("./middleware");
const { checkCommentOwnership } = require("./middleware");


//addquestions
app.use('/',require('./routes/addquestion'))

//addcomment
app.use('/',require('./routes/add_comment'))

//editcomments
app.use('/',require('./routes/edit_comment'))

//delete question
app.delete("/secret/show/:id",middleware.checkCampground2Ownership,function(req,res){
	Campground2.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/secret/show");
		}else{
			console.log()
			res.redirect("/secret/show");
		}
	});
	//res.send("You have deleted this post");
});

//answered questions
app.get("/answered",function(req,res){
	Comment.aggregate([
		{$match:{"author.id":mongoose.Types.ObjectId(req.user._id)}} ,
		{
		   $lookup: {
			  from: "campground2",
			  localField: "_id",   
			  foreignField: "comments",  
			  as: "res"
		   },
		},
		{$unwind: "$res"},
	])
	.exec((err,data)=>{
		console.log(data);
		res.render("answered",{data:data,currentUser:req.user})
	})
});


//search and my questions
app.get("/QNA/myquestions",isLoggedIn,function(req,res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground2.find({$and: [{description: regex,}, {key:req.user}]},function(err,data2){

			if(err)
				{
					console.log(err);
				}else{
					res.render("showques",{currentUser:req.user,post2: data2});
				}
		});
	}else{
	Campground2.find({key:mongoose.Types.ObjectId(req.user._id)},function(err,data3){
		if(err)
		{
			console.log(err);
		}
		else{
			console.log(data3)
			res.render("mine",{post3:data3,currentUser:req.user.username});
		}
	})
}
});


//dont know
app.post("/secret/show/show1",isLoggedIn,function(req,res){
	var key=req.user._id;
	var comment=req.body.comment;
	var newComment={key:key,comment:comment};
	Comment.create(newComment,function(err,newlyCreatedComment){
		if(err)
		{
			console.log(err);
		}else{
			res.redirect("/secret/show/show1");
		}
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

/*
const auth=require('./Controllers/user_edit');
const { find } = require("./models/user");
app.use("/",auth)
*/


