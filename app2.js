var express=require("express");
var mongoose=require("mongoose");
var passport=require("passport");
var bodyParser=require("body-parser");
var morgan=require("morgan");
var User=require("./models/user");
var Info=require("./models/info");
var LocalStrategy= require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
mongoose.connect("mongodb://localhost/clanity",{
	useNewUrlParser: true,
	useUnifiedTopology: true
});


var app= express();
app.use(morgan('dev'));
app.set('view engine','ejs');
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
	secret: "Rusty is the cutest dog in the world",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//===================
//ROUTES
//===================

app.get("/edit",isLoggedIn,(req,res)=>{
	console.log(req.user.username)
	res.render("edit");
})

app.get("/account_settings",isLoggedIn,(req,res)=>{
	res.render("account_settings");
})

app.get("/privacy-settings",isLoggedIn,(req,res)=>{
	res.render("privacy-settings");
})

app.get("/password",isLoggedIn,(req,res)=>{
	res.render("password");
})

app.get("/",function(req,res){
	res.render("home");
});



app.get("/secret",isLoggedIn,async function(req,res){
	console.log(req.user.username)
	var details=await Info.find({username:req.user.username}).exec();
	console.log(details)
	res.render("secret",{currentUser:req.user});
	
	
});




//AUTH ROUTES

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	req.body.username
	req.body.password
	User.register(new User({username: req.body.username}),req.body.password, function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/secret");
		});
	});
});

// LOGIN ROUTES
app.get("/login",function(req,res){
	res.render("login");
});

app.post("/login",passport.authenticate("local",{
	successRedirect: "/secret",
	failureRedirect: "/login"
}),function(req,res){
	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});


function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}


app.listen(3000, function() { 
  console.log('Yelpcamp listening on port 3000'); 
});

//Info
const auth=require('./Controllers/user_edit');
const { find } = require("./models/user");
app.use("/",auth)













//////////////////////////////////////////////////

var express=require("express");
var multer =require('multer');
var path   =require('path');
var mongoose=require("mongoose");
var passport=require("passport");
var bodyParser=require("body-parser");
var crypto = require('crypto');
var cors = require('cors'); 
//var fileUpload = require('express-fileupload');
const { getVideoDurationInSeconds } = require('get-video-duration')
var GridFsStorage=require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
var fs = require('fs');
var methodOverride = require('method-override');
var User=require("./models/user");
var Campground=require("./models/info");
var Campground2=require("./models/question");
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
 mongoose.connect("mongodb://localhost/clanity",{
	useNewUrlParser: true,
	useUnifiedTopology: true
});


/*
    http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

*/


const conn = mongoose.connection;

let gfs;
conn.once('open', ()=> {
	//var bucket = new mongodb.GridFSBucket(conn.db);
	gfs = new mongoose.mongo.GridFSBucket(conn.db, {
		bucketName: "upload"
	  });
  })

var app= express();
app.set('view engine','ejs');

var server = app.listen(3000, function() { 
	console.log('Yelpcamp listening on port 3000'); 
  });


const io = require('socket.io').listen(server);


app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(express.static(__dirname+"/public"));


app.use(bodyParser.urlencoded({extended:true}));
app.use(require("express-session")({
	secret: "Rusty is the cutest dog in the world",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


////////////////////////////////////////////
//===================
//ROUTES
//===================


app.get("/video/home/upload",(req,res)=>{
	res.render("upload_video");
})

app.get("/post/home/upload",(req,res)=>{
	res.render("upload_post");
})

app.get("/secret/account_settings",isLoggedIn,(req,res)=>{
	res.render("account_settings");
})

app.get("/secret/privacy-settings",isLoggedIn,(req,res)=>{
	res.render("privacy-settings");
})

app.get("/secret/topic-preferences",isLoggedIn,(req,res)=>{
	res.render("topic-preferences");
})

app.get("/secret/password",isLoggedIn,(req,res)=>{
	res.render("password");
})

app.get("/",function(req,res){
	res.render("home");
});
/////////////////////////////////////////
//Post Section





/*

mongodb.MongoClient.connect(uri, function(error, client) {
  assert.ifError(error);

  const db = client.db(dbName);

  var bucket = new mongodb.GridFSBucket(db);

  fs.createReadStream('./meistersinger.mp3').
    pipe(bucket.openUploadStream('meistersinger.mp3')).
    on('error', function(error) {
      assert.ifError(error);
    }).
    on('finish', function() {
      console.log('done!');
      process.exit(0);
    });
});
*/
var storage = new GridFsStorage({
	url: 'mongodb://localhost/clanity',
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
			metadata: req.user._id,
			bucketName: 'upload'
		  };
		  resolve(fileInfo);
		});
	  });
	}

  });
  const upload = multer({ storage });

app.get("/post/upload",isLoggedIn,(req,res)=>{
	if(gfs) {
		console.log("some error occured, check connection with db");
	  }

	gfs.files.aggregate([
		{
			$lookup:{
				from: "posts",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		
		{$unwind : "$merge"},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},

		{$unwind : "$merge_two"},
		

		
	]).toArray((err,files)=>{

		const v=JSON.stringify(files);
		console.log("postssssssssss  ---- " + v)
		res.render("post",{files:files});
	})
	
})

app.get("/post/image/:filename",(req,res)=>{
	gfs.files.findOne({filename:req.params.filename}, (err,file)=>{
		var readstream = gfs.createReadStream(file.filename);
		//var readstream = gfs.openDownloadStreamByName(file.filename);
		readstream.pipe(res);

	})
})


  var imageF = Post.find({});

app.post("/post/like" , (req,res)=>{
	
	Post.findOne({filename:req.body.like},function(err,post){	
		console.log( req.body.like + req.user.id);
		console.log("0");
		if (Array.isArray(post.likes)) {
			if(post.likes.length >0){
				console.log("inside if");
				var t=0;
				for(var i=0;i<post.likes.length;i++){
					if(post.likes[i]._id == req.user.id){
						post.likes[i].remove();
						console.log("1");
						t++;
						break;
						
					}
					
				}
				if(t==0){
				post.likes.push(req.user.id);
					console.log("2");
				}
			}
			else{
				
				post.likes.push(req.user.id);
				console.log("/-1");
			}
		} else {
			post.likes = [req.user.id];
			console.log("3");
		}
		console.log("4");
			post.save(function(err,data){
				if(err){
					console.log("error likes in post");
				}
				else{
					res.redirect("/secret/edit");
				}
			})
		});
})


  app.post("/post/upload",upload.fields([{
	name: 'file', maxCount: 1
  }, {
	name: 'thumbnail', maxCount: 1
  },
  {
	name: 'pos', maxCount: 1
  }]),(req,res)=>{
	var file = req.files['pos'][0].filename
	console.log("1111111"+ file);

	var imageDetails= new Post({
		key		     :	    req.user,
		filename     : 		file,
		caption      :		req.body.file_name,
		tag			 : 		req.body.description,
		description  :		req.body.des,

})
console.log("22222"+ file);
	imageDetails.save(function(err,doc){
		if(err) throw err;
		imageF.exec(function(err,video){
			if(err) throw err;
			gfs.files.find().toArray((err,files)=>{
				files.map(file=>{
		
				})
			res.render("edit");
		})

	})
	  
  })

})

app.get("/post/my_posts",isLoggedIn,(req,res)=>{

	gfs.files.aggregate([

		{$match:{metadata:req.user._id}} ,

		{
			$lookup:{
				from: "posts",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		{$unwind: "$merge"},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},
		{$unwind: "$merge_two"},
	]).toArray((err,files)=>{
		const v=JSON.stringify(files);
		
		res.render("post",{files:files})
	})
})





//////////////////////////////////////////////////////////////////
/*Question section*/ 
/////////////////////////////////////////////////////////////////
app.get("/secret/question",isLoggedIn,function(req,res){
	
	Campground2.find({key:req.user._id},function(err,allCampgrounds){
		if(err)
			{
				console.log(err);
			}else{
				console.log(allCampgrounds)
				res.render("question",{details:allCampgrounds,currentUser:req.user.username});
			}
	})
});



app.post("/secret/question",isLoggedIn,function(req,res){
	
    //get data from form and add to campgrounds array
    var key = req.user._id;
	var dsc=req.body.description;
	var newCampground={description: dsc};
	//campgrounds1.push(newCampground);
	const filter = { key:key };
	const update = { key:key,description: dsc };

	const opts = {key:key, new: true, upsert: true };
	Campground2.create(filter,update, opts,function(err,newlyCreatedCampground){
		if(err)
			{
				//res.redirect("new");
				console.log(err);
			}else{
				res.redirect("/secret");
			}
	});

});


app.get("/secret/show",isLoggedIn,function(req,res){
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground2.find({description: regex},function(err,data2){

		Campground2.aggregate([
		
		{
			$lookup:{
				from: "users",
				localField: "key",
				foreignField: "_id",
				as: "merge"
			}
		},

		{$unwind : "$merge"},

		
	]).exec((err,files)=>{
		const v=JSON.stringify(files);
		console.log("data" + files);
		if(err)
				{
					console.log(err);
				}else{
					res.render("showques",{currentUser:req.user,post2: data2,files:files});
				}
		});
		
	})
			
			
	}else{
		Campground2.find({},function(err,data2){
			
		if(err)
			{
				console.log(err);
			}else{
				console.log("jhbuhuhv");
				res.render("showques",{currentUser:req.user,post2: data2});
			}
	})
}

	//res.render("secret",{currentUser:req.user,sohom: campgrounds1});
	console.log(req.user);
});



/* End of question section */
///////////////////////////////////////////

//////////////////////////////////////////
/* video section search bar */
app.get("/video/search",isLoggedIn,function(req,res){

	gfs.files.aggregate([
		{
			$lookup:{
				from: "uploads",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		
		{$unwind : "$merge"},

		{$match:{$or:[{"merge.file_name":{'$regex':req.query.search}},{"merge.description":{'$regex':req.query.search}}]}} ,

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},

		{$unwind : "$merge_two"},

		
	]).toArray((err,files)=>{
		const v=JSON.stringify(files);
		console.log("data" + v)
		res.render("upload",{files:files})
	})
});
/* end of search bar in vedio section */
//////////////////////////////////////////

//////////////////////////////////////////
/* testing */ 


  ////////////  

  app.get("/video/upload",isLoggedIn,(req,res)=>{

	gfs.files.aggregate([
		{
			$lookup:{
				from: "uploads",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		
		{$unwind : "$merge"},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},

		{$unwind : "$merge_two"},
		

		
	]).toArray((err,files)=>{

		const v=JSON.stringify(files);
		console.log("datanbjhhjvhv   ---- " + v)
		res.render("upload",{files:files})
	})
	
})

app.get("/video/:filename",(req,res)=>{
	gfs.files.findOne({filename:req.params.filename}, (err,file)=>{
		var readstream = gfs.createReadStream(file.filename);
		readstream.pipe(res);

	})
})

/////////////

/*
var Storage=multer.diskStorage({
	destination:"./public/uploads",
	filename:(req,file,cb)=>{
		cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
	}
})

var uploadThumbnail= multer({
	storage:Storage
}).single('thumbnail');

app.post("/video/upload",isLoggedIn,upload,function(req,res){
	var thumbnail=req.thumbnail.filename;
	
var imageDetails= new Upload({
	key		 : req.user._id,
	file	 : thumbnail
});

imageDetails.save(function(err,doc){
	if(err) throw err;
	imageFind.exec(function(err,video){
		if(err) throw err;
		res.render("edit",{video:video})
	})
	
})

})
*/

//////////////


var imageFind = Upload.find({});

/*var middleware = {
    upload: function(req, res, next) {
		var file = req.file;
		console.log('Original request hit : '  + file);
        next();
    },
    uploading: function(req, res, next) {
		var thumbnail = req.thumbnail;
       console.log('Original request hit : '+ thumbnail);
       next();
    }
}*/

  app.post("/video/upload",upload.fields([{
	name: 'file', maxCount: 1
  }, {
	name: 'thumbnail', maxCount: 1
  }]),(req,res)=>{
	const file = req.files['file'][0].filename;
	const thumbnail = req.files['thumbnail'][0].filename;
	console.log("one " + file);
	console.log("two " + thumbnail);

	var imageDetails= new Upload({
		key		     :	    req.user,
		filename     : 		file,
		thumbnail	 :      thumbnail,
		caption      :		req.body.file_name,
		tag          : 		req.body.description,

})
	
	imageDetails.save(function(err,doc){
		if(err) throw err;
		imageFind.exec(function(err,video){
			if(err) throw err;
			gfs.files.find().toArray((err,files)=>{
				files.map(file=>{
		
				})
			res.render("edit");
		})

	})
	  
  })

})

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//-----------------------Favorite---------------------------------//
	app.post("/vid/like",(req,res)=>{
	
	Upload.findOne({filename:req.body.like},function(err,video){	
		console.log( req.body.like + req.user.id);
		console.log("0");
		if (Array.isArray(video.likes)) {
			if(video.likes.length > 0){
				console.log("inside if");
				var t=0;
				for(var i=0;i<video.likes.length;i++){
					if(video.likes[i]._id == req.user.id){
						video.likes[i].remove();
						console.log("1");
						t++;
						break;
						
					}
					
				}
				if(t==0){
				video.likes.push(req.user.id);
					console.log("2");
				}
			}
			else{
				
				video.likes.push(req.user.id);
				console.log("/-1");
			}
		} else {
			video.likes = [req.user.id];
			console.log("3");
		}
		console.log("4");
			video.save(function(err,data){
				if(err){
					console.log("error likes in post");
				}
				else{
					res.redirect("/secret/edit");
				}
			})
		});
})

app.get("/vid/like",isLoggedIn,(req,res)=>{

	gfs.files.aggregate([
		{
			$lookup:{
				from: "uploads",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		
		{$unwind : "$merge"},
		//{$unwind : "$(merge.likes)"},
		{$match : {"merge.likes" : {$elemMatch  : {"_id" : req.user._id}}}},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},

		{$unwind : "$merge_two"},
		

		
	]).toArray((err,files)=>{
		const v=JSON.stringify(files);
		console.log("likeddddddd   ---- " + v)
		res.render("upload",{files:files})
	})
	
})
//////////////////////////////////////////////////

app.post("/vid/favourite",(req,res)=>{
	
	Upload.findOne({filename:req.body.favorite},function(err,video){	
		console.log( req.body.like + req.user.id);
		console.log("0");
		if (Array.isArray(video.favorite)) {
			if(video.favorite.length >0){
				console.log("inside if");
				var t=0;
				for(var i=0;i<video.favorite.length;i++){
					if(video.favorite[i]._id == req.user.id){
						video.favorite[i].remove();
						console.log("1");
						t++;
						break;
						
					}
					
				}
				if(t==0){
				video.favorite.push(req.user.id);
					console.log("2");
				}
			}
			else{
				
				video.favorite.push(req.user.id);
				console.log("/-1");
			}
		} else {
			video.favorite = [req.user.id];
			console.log("3");
		}
		console.log("4");
			video.save(function(err,data){
				if(err){
					console.log("error likes in post");
				}
				else{
					res.redirect("/secret/edit");
				}
			})
		});
})

app.get("/vid/favourite",isLoggedIn,(req,res)=>{

	gfs.files.aggregate([
		{
			$lookup:{
				from: "uploads",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		
		{$unwind : "$merge"},
		//{$unwind : "$(merge.likes)"},
		{$match : {"merge.favorite" : {$elemMatch  : {"_id" : req.user._id}}}},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},

		{$unwind : "$merge_two"},
		

		
	]).toArray((err,files)=>{
		const v=JSON.stringify(files);
		console.log("favoriteeeeeeeeee   ---- " + v)
		res.render("upload",{files:files})
	})
	
})

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//-----------------------like---------------------------------//

////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
//---------------------my videos-------------------------------//

app.get("/vid/my_videos",isLoggedIn,(req,res)=>{

	gfs.files.aggregate([

		{$match:{metadata:req.user._id}} ,

		{
			$lookup:{
				from: "uploads",
				localField: "filename",
				foreignField: "filename",
				as: "merge"
			}
		},
		{$unwind: "$merge"},

		{
			$lookup:{
				from: "users",
				localField: "metadata",
				foreignField: "_id",
				as: "merge_two"
			}
		},
		{$unwind: "$merge_two"},
	]).toArray((err,files)=>{
		const v=JSON.stringify(files);
		console.log("datanbjhhjvhv   ---- " + v)
		res.render("my_videos",{videos:files})
	})
})

////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
/*My videos section */



/*

app.get("/video/my_videos",isLoggedIn,(req,res)=>{
	Upload.find({key:req.user._id},function(err,videos){
		if(err)
			{
				console.log(err);
			}else{
				res.render("my_videos",{videos:videos});
			}
	})
	
})
*/


/*Upload section*/



var imageFind = Upload.find({});

app.get("/video/upload",isLoggedIn,(req,res)=>{
	imageFind.exec(function(err,video){
		if(err) throw err;
		console.log("tttt")
		res.render("upload",{video:video,User:User})
	})
	
})

/*var Storage=multer.diskStorage({
	destination:"./public/uploads",
	filename:(req,file,cb)=>{
		cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname))
	}
})

app.get("/autocomplete/",function(req,res,next){
	console.log("incomplete");

	var regex = new RegExp(req.query["term"],'i');
	var searchdata= Upload.find({file_name:regex},{'file_name':1} ).sort({"updated_at":-1}).sort({'created_at':-1}).limit(10);
	searchdata.exec(function(err,data){
		console.log("auto_complete  -- " + data);
		var result=[];
		if(!err){
			if(data && data.length && data.length > 0){
				data.forEach(user=>{
					let obj={
						id		: user._id,
						label	: user.file_name
					};
					result.push(obj);
				});
			}

			res.json(result);
		}

		else{
			console.log("incomplete");
		}
	})
})
*/


/*End of search bar auto complete */ 


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
	var friend_request = req.body.request;
	var sender = req.user._id;	
	
	Campground.findOne({key:friend_request},function(err,message){
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

	

		Campground.findOne({key:sender},function(err,message){
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
		var friend_request = req.body.request;
		var sender = req.user._id;	
		
		Campground.findOne({key:sender},function(err,message){
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
	
		
	
			Campground.findOne({key:friend_request},function(err,message){
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
				var friend_request = req.body.request;
				var sender = req.user._id;	
				
				Campground.findOne({key:sender},function(err,message){
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
			
				
			
					Campground.findOne({key:friend_request},function(err,message){
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

/*
app.get("/secret/friend/:id",(req,res)=>{
	 var friend_request = req.params.id;
	Edit.findOne({key:friend_request},function(err,message){	
		if (Array.isArray(message.request)) {
			if(message.request.length >0){
				var t=0;
				for(var i=0;i<message.request.length;i++){
					if(message.request[i]._id == friend_request){
						message.request[i].remove();
						t++;
						break;
						
					}
					
				}
				if(t==0){
					message.request.push(friend_request);
					console.log("2");
				}
			}
			else{
				
				message.request.push(friend_request);
				console.log("/-1");
			}
		} else {
			message.request = [friend_request];
			console.log("3");
		}
		console.log("4");
			message.save(function(err,data){
				if(err){
					console.log("error likes in post");
				}
				else{
					res.redirect("/secret");
				}
			})
		});
})*/


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
	Campground.find({name:usd},function(err,data){
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
	console.log("yyyyyyyyyyyyyyyyy" + req.params.id);
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





/////////////////

app.get("/secret",isLoggedIn,function(req,res){
	
	Campground.find({key:req.user._id},function(err,allCampgrounds){

		Campground2.find({key:req.user._id},function(err,data){

		if(err)
			{
				console.log(err);
			}else{
				allCampgrounds.map(allCampgrounds=>{
					res.render("secret",{currentUser:req.user,sohom: allCampgrounds,post:data});
				})
				
			}
	})

})
	//res.render("secret",{currentUser:req.user,sohom: campgrounds1});
	console.log(req.user);
});

app.get("/secret/new",isLoggedIn,function(req,res){
	
	Campground.find({key:req.user._id},function(err,allCampgrounds){
		if(err)
			{
				console.log(err);
			}else{
				console.log(allCampgrounds)
				res.render("new",{details:allCampgrounds,currentUser:req.user.username});
			}
	})
});

app.get("/secret/edit",isLoggedIn,function(req,res){
	
	

	Edit.find({key:req.user._id},function(err,allEdit){
		if(err)
			{
				console.log(err);
			}else{
				console.log(allEdit)
				res.render("edit",{details:allEdit,currentUser:req.user.username});
			}

		
	})
});



app.post("/secret/new",function(req,res){
	
    //get data from form and add to campgrounds array
    var key = req.user._id;
	var name=req.body.name;
	var place=req.body.place;
	var dsc=req.body.description;
	var newCampground={ name:name , place:place, description: dsc};
	//campgrounds1.push(newCampground);
	const filter = { key:key };
	const update = { key:key,name:name , place:place, description: dsc };

	const opts = {key:key, new: true, upsert: true };
	Campground.findOneAndUpdate(filter,update, opts,function(err,newlyCreatedCampground){
		if(err)
			{
				//res.redirect("new");
				console.log(err);
			}else{
				res.redirect("/secret");
			}
	});

});
	//redirect back to campground page

	app.post("/secret/edit",isLoggedIn,function(req,res){
		var workplace;
		//get data from form and add to campgrounds array
		var key = req.user._id;
		var name=req.body.name;
		var place=req.body.place;
		var dsc=req.body.description;
		var work=req.body.work;
		var start_date=req.body.start_date;
		if(!req.body.workplace){
			workplace=false;
		}
		else{
			workplace=true;
		}
		
		var end_date=req.body.end_date;
		var profession =req.body.profession;
		var newEdit={key:key, name:name , place:place, description: dsc,start_date:start_date,workplace:workplace,end_date:end_date,profession:profession};
		
		const filter = { key:key };
		const update = { key:key, name:name , place:place, description: dsc,work:work,start_date:start_date,workplace:workplace,end_date:end_date,profession:profession };
	
		const opts = { new: true, upsert: true };
		Edit.findOneAndUpdate(filter,update, opts,function(err,newlyCreatedEdit){
			if(err)
				{
					//res.redirect("new");
					console.log(err);
				}else{
					res.redirect("/secret");
				}
		});
	
	
	});

	app.post("/secret/account",isLoggedIn,function(req,res){
		var key=req.user._id;
		var email=req.body.edit_email;
		var user=req.body.edit_username;
		
		const filter = { _id: key };
		const update = { username:user,email:email };
	
		const opts = { new: true, upsert: true };
		User.findOneAndUpdate(filter,update, opts,function(err,newlyCreatedData){
			if(err)
				{
					//res.redirect("new");
					console.log(err);
				}else{
					res.redirect("/secret");
				}
		});
	
	});



app.post("/secret/privacy",isLoggedIn,function(req,res){
	
    //get data from form and add to campgrounds array
    var key						= req.user._id;
	var see_your_post			= req.body.privacy1;
	var like_dislike_comment	= req.body.privacy2;
	var  share    				= req.body.privacy3;
	var see_connections_followes= req.body.privacy4;
	var send_you_message 		= req.body.privacy5;
	var can_follow_you			= req.body.privacy6;

	var newData={see_your_post : see_your_post,like_dislike_comment : like_dislike_comment ,  share :  share ,see_connections_followes : see_connections_followes, send_you_message : send_you_message , can_follow_you : can_follow_you};
	
	const filter = { key:key};
	const update = {see_your_post : see_your_post,like_dislike_comment : like_dislike_comment ,  share :  share ,see_connections_followes : see_connections_followes, send_you_message : send_you_message , can_follow_you : can_follow_you};

	const opts = { new: true, upsert: true };
	Privacy.findOneAndUpdate(filter,update, opts,function(err,newlyCreatedData){
		if(err)
			{
				//res.redirect("new");
				console.log(err);
			}else{
				res.redirect("/secret");
			}
	});

});
//AUTH ROUTES

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	req.body.username
	req.body.password
	User.register(new User({username: req.body.username}),req.body.password, function(err,user){
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/secret");
		});
	});
});

// LOGIN ROUTES
app.get("/login",function(req,res){
	res.render("login");
});

app.post("/login",passport.authenticate("local",{
	successRedirect: "/secret",
	failureRedirect: "/login"
}),function(req,res){
	
});

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});


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
