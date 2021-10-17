const Datastore = require("nedb");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const methodOverride = require("method-override");
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');
const marked = require('marked');
const createDomPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const dompurify = createDomPurify(new JSDOM().window); 
require("dotenv").config();

const app = express();
//Database
const database = new Datastore("./database.db");
const database_voca = new Datastore("./database_voca.db");
const database_managerVoca = new Datastore("./managerVoca.db");
const database_grammar = new Datastore("./database_grammar.db");
// port of the website
const port = process.env.port || 3000;
//initialize passport
const initializePassport = require("./passport-config");
initializePassport(
	passport,
	username => admin_username.find(user => user.username === username),
	id => admin_username.find(user => user.id === id)
);
//Load data from database
database.loadDatabase();
database_voca.loadDatabase();
database_managerVoca.loadDatabase();
database_grammar.loadDatabase();
//set the folder of view is views and view engine is handlebar
app.set("views", "./views");
app.set("view engine", "hbs");
//use the functions of modules
app.use(flash());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//username and password of admin
const admin_username = [
	{
		id: Date.now().toString(),
		username: process.env.USERNAME_ADMIN,
		password: process.env.PASSWORD_ADMIN
	}
];

let error;
//The main page
app.get("/", function(req, res) {
  	res.render("home", { error: error });
});

// let user;
// let voca;
// let voca_main;
//Render all the data in database
// database.find({}, (err, data) => {
// 	if (err) {
// 		return;
// 	}

// 	user = data;
// });

// database_voca.find({}, (err, data) => {
// 	if (err) {
// 		return;
// 	}
// 	voca = data;
// });

// database_managerVoca.find({}, (err, data) => {
// 	if (err) {
// 		return;
// 	}
// 	voca_main = data;
// });
//Receive the queston from home page
app.post("/", (req, res) => {
	const data = req.body;
	if (data.ques === "" || data.Mess === "" || data.email === "") {
		error = "Please finish these information before submit";
		console.log(error);
		res.redirect("/");
	} else {
		error = null;
		database.insert(data);
		database.find({}, (err, data) => {
			if (err) {
				res.end();
				return;
			}

			user = data;
		});
		res.redirect("/end");
	}
});
//All the routers of website
app.get("/end", (req, res) => {
  	res.render("end");
});
app.get("/app", (req, res) => {
  	res.render("app");
});
app.get("/eng", (req, res) => {
 	 res.render("eng");
});
app.get("/eng/voca", (req, res) => {
	database_voca.find({}, (err, data)=>{
		if (err) {
			return
		}
		res.render("voca", { voca: data });
	})
});
app.get("/eng/incl", (req, res) => {
 	res.render("include", { check_send: check_send });
});
app.get('/eng/grammar',(req, res)=>{
	database_grammar.find({parentFolder : 'main'}, (err, data)=>{
		if (err) {
			return
		}
		res.render('grammar',{grammar:data})
	})
})
app.get("/eng/search", (req, res) => {
	res.render("search", {
		search: vocabul,
		check: look_up,
		result: result,
		s: check_2
	});
});
//Add more new words
let vocabul = null;
let check_send;
app.post("/eng/incl", (req, res) => {
	const data_voca = req.body;

	if (data_voca.Eng === "" || data_voca.type === "" || data_voca.mean === "") {
		check_send = "Vui lòng nhập đầy đủ thông tin";
		res.redirect("/eng/incl");
	} else {
		database_voca.find(
		{
			Eng: data_voca.Eng.toLowerCase().trim(),
			type: data_voca.type,
			mean: data_voca.mean.toLowerCase().trim()
		},
		(err, data) => {
			if (data.length === 0) {
			check_send = "Bạn đã gửi thành công";
			database_managerVoca.insert({
				Eng: data_voca.Eng.toLowerCase().trim(),
				type: data_voca.type,
				mean: data_voca.mean.toLowerCase().trim()
			});
			// database_managerVoca.find({}, (err, data) => {
			// 	if (err) {
			// 	return;
			// 	}
			// 	voca_main = data;
			// });
			} else {
			check_send = "Từ và nghĩa này đã có trong trang web";
			}
		}
		);
		res.redirect("/eng/incl");
	}
});
//Search the vocabulary
let look_up = null;
let result = null;
let check_2 = null;
app.post("/eng/search", (req, res) => {
	const data = req.body;
	if (data.Eng !== "") {
		look_up = null;
		vocabul = searchEng(data.Eng.toLowerCase().trim());
		setTimeout(() => {
		if (vocabul.length === 0) {
			console.log("No result");
			result = "Không có kết quả";
		} else {
			result = null;
			check_2 = "Đây là kết quả tìm kiếm của bạn";
		}
		}, 200);
	} else if (data.mean !== "") {
		look_up = null;
		vocabul = searchmean(data.mean.toLowerCase().trim());
		setTimeout(() => {
		if (vocabul.length === 0) {
			console.log("No result");
			result = "Không có kết quả";
		} else {
			result = null;
			check_2 = "Đây là kết quả tìm kiếm của bạn";
		}
		}, 200);
	} else if (data.Eng === "" && data.mean === "") {
		result = null;
		check_2 = null;
		look_up = "Vui lòng nhập từ hoặc nghĩa trước khi gửi";
	} else {
		database_voca.find(
		{
			Eng: data.Eng.toLowerCase().trim(),
			mean: data.mean.toLowerCase().trim()
		},
		(err, data) => {
			if (err) {
				return;
			}
			console.log(data.length);
			vocabul = data;
			if (data.length === 0) {
				result = "Không có kết quả";
			} else {
				result = null;
				check_2 = "Đây là kết quả tìm kiếm của bạn";
			}
		}
		);
	}
	res.redirect("/eng/search");
});
//Search the grammar

//All the routers of admin:
app.get("/ad-login", checknotAuthen, (req, res) => {
  	res.render("ad-login");
});
app.get("/admin", checkAuthen, (req, res) => {
 	 res.render("admin");
});
//Login the admin page
app.post(
	"/ad-login",
	checknotAuthen,
	passport.authenticate("local", {
		successRedirect: "/admin",
		failureRedirect: "ad-login",
		failureFlash: true
	})
);
//Logout admin page
app.delete("/ad-logout", (req, res) => {
	req.logOut();
	res.redirect("/ad-login");
});
//Manager question from home page in admin
app.get("/ad-ques", checkAuthen, (req, res) => {
 	database.find({}, (err, data)=>{
		if (err) {
			return
		}
		res.render("admin-ques", { user: data });
	})
});
//Manager vocabulary added from English page
app.get("/ad-voca", checkAuthen, (req, res) => {
	database_managerVoca.find({}, (err, data)=>{
		if (err) {
			return
		}
		res.render("admin-voca", { voca_main: data });
	})
});
//Manager grammar blog of website
app.get('/ad-grammar',checkAuthen,(req, res)=>{
	database_grammar.find({parentFolder: 'main'}, (err, data)=>{
		if(err) {
			return
		}
		res.render('admin-grammar',{grammar:data})
	})
})
//Add the new words to the database and website's dictionary
app.post("/ad-voca", checkAuthen, (req, res) => {
	const data_voca = req.body;

	database_voca.insert({
		Eng: data_voca.Eng.toLowerCase().trim(),
		type: data_voca.type,
		mean: data_voca.mean.toLowerCase().trim()
	});
	database_managerVoca.remove({
		Eng: data_voca.Eng.toLowerCase().trim(),
		type: data_voca.type,
		mean: data_voca.mean.toLowerCase().trim()
	}, (err, number)=>{
		if(err){
			return
		}
	})
	// database_voca.find({}, (err, data) => {
	// 	if (err) {
	// 	return;
	// 	}
	// 	voca = data;
	// });
	res.redirect("/ad-voca");
});
//Creating blog page
app.get('/ad-grammar/new_blog',checkAuthen,(req, res)=>{
	res.render('newBlog',{error: errorTitle,path: '/ad-grammar/new_blog'})
})
//Creating blog page for folder:
app.get('/ad-grammar/:slug/new_blog',checkAuthen, (req, res)=>{
	// console.log(req.params.slug)
	res.render('newBlog',{error: errorTitle,path: `/ad-grammar/${req.params.slug}/new_blog`})
})
//Show the Folder and Blog Page:
app.get('/eng/grammar/:slug', (req, res)=>{
	database_grammar.find({}, (err, suggestion)=>{
		if(err){
			return
		}
		database_grammar.findOne({slug: req.params.slug},(err, data)=>{
			if(err){
				return
			}
			console.log(data)
			if(data != null){
				database_grammar.findOne({slug: data.parentFolder},(err, parentFolder)=>{
					if(err){
						return
					}
					let parentURL = null
					if(parentFolder != null){
						parentURL = parentFolder
					}
					if(data.kind == 'blog'){
						res.render('show_blog',{article:data,suggestion:suggestion,parentURL: parentURL})
					}else{
						database_grammar.find({parentFolder: req.params.slug},(err, list)=>{
							if(err){
								return
							}
							res.render('show_folder',{folder: data,parentURL: parentURL,grammar: list})
						})
					}
				})
			}

		})
	})
})
//Show the blog in folder:

//Create a new blog
let errorTitle = null
app.post('/ad-grammar/new_blog',checkAuthen,(req, res)=>{
	let article = req.body
	database_grammar.find({title: article.title}, (err, data)=>{
		if(err){
			return
		}
		// console.log(data.length)
		if(data.length != 0){
			errorTitle = 'Lỗi: Bị trùng tên tiêu đề với blog khác'
			res.redirect('/ad-grammar/new_blog')
		}else{
			errorTitle = null
			if(article.title){
				slug = slugify(article.title + ' ' + uuidv4(),{lower:true,strict: true})
			}
			let html = dompurify.sanitize(marked(article.content))
			database_grammar.insert({title: article.title , content: article.content, slug: slug,kind: 'blog',HTML: html,parentFolder: 'main'})
			res.redirect(`/eng/grammar/${slug}`)
		}
	})
})
//Create a new blog in folder:
app.post('/ad-grammar/:slug/new_blog',checkAuthen,(req, res)=>{
	let article = req.body
	database_grammar.find({title: article.title}, (err, data)=>{
		if(err){
			return
		}
		// console.log(data.length)
		if(data.length != 0){
			errorTitle = 'Lỗi: Bị trùng tên tiêu đề với blog khác'
			res.redirect('/ad-grammar/new_blog')
		}else{
			errorTitle = null
			if(article.title){
				slug = slugify(article.title +' '+ uuidv4(),{lower:true,strict: true})
			}
			let html = dompurify.sanitize(marked(article.content))
			database_grammar.insert({title: article.title , content: article.content, slug: slug,kind: 'blog',HTML: html,parentFolder: req.params.slug})
			res.redirect(`/eng/grammar/${slug}`)
		}
	})	
})
//Editing a Folder and Blog Page
app.get('/ad-grammar/edit/:slug',checkAuthen,(req, res)=>{
	database_grammar.findOne({slug : req.params.slug}, (err, data)=>{
		if(err){
			return
		}
		if(data.kind == 'blog'){
			res.render('editBlog',{article:data,path: `/ad-grammar/edit/${req.params.slug}`})	
		}else{
			let folder = data
			database_grammar.find({parentFolder: req.params.slug}, (err, data)=>{
				if(err){
					return
				}
				// console.log(link)
				let backward = null
				if(folder.parentFolder != 'main'){
					backward = folder.parentFolder
				}
				res.render('ad-view_folder',{folder: folder,backward: backward,content: data})
			}) 
		}
	})	
})
//Edit a Blog:
app.put('/ad-grammar/edit/:slug', (req, res)=>{
	let query =  req.body  
	let html =  dompurify.sanitize(marked(query.content))
	database_grammar.update({slug: req.params.slug},{$set:{title: query.title, content: query.content,HTML:html}})
	res.redirect(`/ad-grammar/edit/${req.params.slug}`)
})
//Edit a blog in folder:
app.get('/ad-grammar/:slug/edit/:blog',(req, res)=>{
	database_grammar.findOne({slug : req.params.blog}, (err, data)=>{
		if(err){
			return
		}
		res.render('editBlog',{article: data,path: `/ad-grammar/${req.params.slug}/edit/${req.params.blog}`})
	})
})
app.put('/ad-grammar/:slug/edit/:blog',(req, res)=>{
	let query =  req.body  
	let html =  dompurify.sanitize(marked(query.content))
	database_grammar.update({slug: req.params.blog},{$set:{title: query.title, content: query.content,HTML:html}})
	res.redirect(`/ad-grammar/${req.params.slug}/edit/${req.params.blog}`)
})
//Delete the Folder and Blog
app.delete('/ad-grammar/:slug',(req, res)=>{
	database_grammar.findOne({slug: req.params.slug},(err, data)=>{
		if(err){
			return
		}
		if(data.parentFolder == 'main'){
			res.redirect('/ad-grammar')
		}else{
			res.redirect(`/ad-grammar/edit/${data.parentFolder}`)
		}
		if(data.kind == 'blog'){
			database_grammar.remove({slug: req.params.slug})
		}else{
			clearData(req.params.slug)
		}
	})
})
//Creating folder page:
app.get('/ad-grammar/new_folder',(req, res)=>{
	res.render('newFolder',{path: '/ad-grammar/new_folder'})
})
//Creating a folder page in a folder:
app.get('/ad-grammar/:slug/new_folder',checkAuthen, (req, res)=>{
	res.render('newFolder',{path: `/ad-grammar/${req.params.slug}/new_folder`})
})
//Create a new folder
app.post('/ad-grammar/new_folder',(req, res)=>{
	let name = req.body.name;
	let id = uuidv4()
	let slug = slugify(name + ' ' + id,{lower:true,strict: true})
	database_grammar.insert({name: name,slug: slug,kind: 'folder',parentFolder: 'main'})
	res.redirect(`/ad-grammar/edit/${slug}`)
})
//Create a new folder in a folder
app.post('/ad-grammar/:slug/new_folder',checkAuthen, (req, res)=>{
	let name = req.body.name;
	let id = uuidv4()
	let slug = slugify(name + ' ' + id,{lower:true,strict: true})
	// console.log(req.params.slug)
	database_grammar.insert({name: name,slug: slug,kind: 'folder',parentFolder: req.params.slug})
	res.redirect(`/ad-grammar/edit/${slug}`)
})
//Edit folder name:
app.get('/ad-grammar/:slug/editname',checkAuthen, (req, res)=>{
	database_grammar.findOne({slug: req.params.slug},(err,data)=>{
		if(err){
			return
		}
		res.render('editFolderName',{folder: data})
	})
})
app.post('/ad-grammar/:slug/editname',checkAuthen, (req, res)=>{
	let name = req.body.name
	let id = uuidv4()
	let slug = slugify(name + ' ' + id,{lower:true,strict: true})
	database_grammar.update({slug: req.params.slug},{$set:{name: name,slug: slug}})
	database_grammar.find({parentFolder: req.params.slug}, (err, data)=>{
		if(err){
			return
		}
		for(let i = 0; i < data.length; i++){
			database_grammar.update({parentFolder: req.params.slug},{$set:{parentFolder: slug}})
		}
	})
	res.redirect(`/ad-grammar/edit/${slug}`)
})
//Function check Authenticated is true or false
function checkAuthen(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect("/ad-login");
}

function checknotAuthen(req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect("/admin");
	}
	next();
}
//Function of searching English and meaning
function searchEng(search) {
	let final = [];
	database_voca.find({}, (err, data) => {
		if (err) {
		return;
		}
		let word = data.map(w => {
			return w.Eng;
		});
		let result = [];
		for (let i = 0; i < word.length; i++) {
			let find = word[i].indexOf(search);
			if (find != -1) {
				result.push(word[i]);
			}
		}
		let check_out = [];
		for (let j = 0; j < result.length; j++) {
			if (check_out.indexOf(result[j]) == -1) {
				check_out.push(result[j]);
				database_voca.find({ Eng: result[j].toString() }, (err, data) => {
					if (err) {
						return;
					}
					for (let n = 0; n < data.length; n++) {
						final.push(data[n]);
					}
				});
			}
		}
	});
	return final;
}

function searchmean(search) {
	let final = [];
	database_voca.find({}, (err, data) => {
		if (err) {
		return;
		}
		let word = data.map(w => {
		return w.mean;
		});
		let result = [];
		for (let i = 0; i < word.length; i++) {
		let find = word[i].indexOf(search);
		if (find != -1) {
			result.push(word[i]);
		}
		}
		let check_out = [];
		for (let j = 0; j < result.length; j++) {
		//console.log(check_out)
		if (check_out.indexOf(result[j]) == -1) {
			check_out.push(result[j]);
			database_voca.find({ mean: result[j].toString() }, (err, data) => {
			if (err) {
				return;
			}
			for (let n = 0; n < data.length; n++) {
				final.push(data[n]);
			}
			});
		}
		}
	});
	return final;
}
//Function of filtering data grammar:
// function filterTheGrammarTitle(article,titleInput){
// 	let result = false
// 	for(let i = 0 ; i < article.length; i++){
// 		if(article[i].title == titleInput){
// 			result = true
// 		}
// 	}
// 	return result
// }
function clearData(folder_slug){
	database_grammar.find({parentFolder: folder_slug}, (err, data)=>{
		if(err){
			return
		}
		for(let i = 0; i < data.length; i++){
			if(data[i].kind == 'blog'){
				database_grammar.remove({slug: data[i].slug})
			}else{
				clearData(data[i].slug)
			}
		}
	})
	database_grammar.remove({slug: folder_slug})
}
app.listen(port, () => {
  	console.log(`Connect to ${port}`);
});
