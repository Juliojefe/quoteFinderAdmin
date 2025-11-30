import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'cst336 csumb',
  resave: false,
  saveUninitialized: true,
//   cookie: { secure: true }   //  only works in production
}))
app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({ extended: true }));

//setting up database connection pool
const pool = mysql.createPool({
  host: "w1h4cr5sb73o944p.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  user: "bp1t2waqynoo300o",
  password: "xhvh50l86emzmr72",
  database: "zutb6skwh6b157ly",
  connectionLimit: 10,
  waitForConnections: true
});

app.get('/addQuote', isUserAuthenticated, async (req, res) => {
  //  search by author
  let authorsSql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authorRows] = await pool.query(authorsSql);
  //  search by category
  let categoriesSql = "SELECT DISTINCT category FROM quotes;";
  const [categoriesRows] = await pool.query(categoriesSql);
  res.render("newQuote.ejs", { 
    authorRows, 
    active: "addQuote",
    categoriesRows 
  });
});

app.get('/', (req, res) => {
  res.render('login.ejs');
});

app.get('/home', isUserAuthenticated, (req, res) => {
  res.render('home.ejs', { active: "home" });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/')
});

app.post('/loginProcess', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let sql = `select * from users where username = ?`;
  const [rows] = await pool.query(sql, [username]);
  if (rows.length === 0) {
    return res.render('login.ejs', { loginError: "Wrong credentials" });
  }
  const match = await bcrypt.compare(password, rows[0].password);
  if (match) {
    req.session.isUserAuthenticated = true;
    req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
    res.render('home.ejs', { active: "home" });
  } else {
    res.render('login.ejs', { loginError: "Wrong Credentials" });
  }
});

app.get('/newRoute', isUserAuthenticated, (req, res) => {
  res.render('newView.ejs')
});

// middleware functions
function isUserAuthenticated(req, res, next) {
  if (req.session.isUserAuthenticated) {
    next();
  } else {
    res.redirect('/')
  }
}

//  displays form to update quote
app.get('/updateQuote', isUserAuthenticated, async (req, res) => {
  let quoteId = req.query.quoteId;
  let sql = `SELECT * FROM quotes WHERE quoteId = ?`;
  const [quoteInfo] = await pool.query(sql, [quoteId]);
  //  search by author
  let authorsSql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authorRows] = await pool.query(authorsSql);
  //  search by category
  let categoriesSql = "SELECT DISTINCT category FROM quotes ORDER BY category";
  const [categoriesRows] = await pool.query(categoriesSql);
  res.render("updateQuote.ejs", { 
    quoteInfo, 
    authorRows,
    categoriesRows 
  });
});

app.post('/updateQuote', isUserAuthenticated, async (req, res) => {
  let quoteId = req.body.quoteId;
  let authorId = req.body.authorId;
  let category = req.body.category;
  let quote   = req.body.quote;
  let sql = `UPDATE quotes 
             SET authorId = ?, category = ?, quote = ? 
             WHERE quoteId = ?`;
  let sqlParams = [authorId, category, quote, quoteId];
  const [result] = await pool.query(sql, sqlParams);
  res.redirect('/home');
});

app.delete('/deleteQuote', isUserAuthenticated, async (req, res) => {
  let quoteId = req.query.id;
  res.redirect('/home');
});

app.delete('/deleteAuthor', isUserAuthenticated, async (req, res) => {
  let authorId = req.query.id;
  res.redirect('/home');
});

// display form to update author info
app.get('/updateAuthor', isUserAuthenticated, async (req, res) => {
  let authorId = req.query.id;
  let sql = `SELECT *,
            DATE_FORMAT(dob, '%Y-%m-%d') ISOdob,
            DATE_FORMAT(dod, '%Y-%m-%d') ISOdod
            FROM authors 
            WHERE authorId = ?`;
  const [authorInfo] = await pool.query(sql, [authorId]);
  res.render("updateAuthor.ejs", { authorInfo });
});

app.post('/updateAuthor', isUserAuthenticated, async (req, res) => {
  let fName = req.body.fn;
  let lName = req.body.ln;
  let authorId = req.body.authorId;
  let dob = req.body.birthday;
  let dod = req.body.deathday;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let portrait = req.body.imageUrl;
  let biography = req.body.bio;
  let sql = `UPDATE authors SET firstName = ?, lastName = ?, dob = ?, dod = ?, sex = ?, profession = ?, country = ?, portrait = ?, biography = ? WHERE authorId = ?`;
  let sqlParams = [fName, lName, dob, dod, sex, profession, country, portrait, biography, authorId];
  const [row] = await pool.query(sql, sqlParams);
  res.redirect('/home');
});

app.get('/allAuthors', isUserAuthenticated, async (req, res) => {
  let sql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authors] = await pool.query(sql);
  res.render("allAuthors.ejs", { 
    authors,
    active: "allAuthors"
   });
});

app.get('/allQuotes', isUserAuthenticated, async (req, res) => {
  let sql = `SELECT quoteId, quote FROM quotes`;
  const [quotes] = await pool.query(sql);
  res.render("allQuotes.ejs", { 
    quotes,
    active: "allQuotes"
  });
});

app.post('/addAuthorQuoteByCategory', isUserAuthenticated, async (req, res) => {
  let authorId = req.body.authorId;
  let cat = req.body.category;
  let quote = req.body.quote;
  let sql = `INSERT INTO quotes (quote, authorId, category) VALUES (?, ?, ?)`;
  let sqlParams = [quote, authorId, cat];
  const [rows] = await pool.query(sql, sqlParams);
  res.render("home.ejs", {active : "home" });
});

//  Displays form to add a new author
app.get('/addAuthor', isUserAuthenticated, async (req, res) => {
  res.render("addAuthor.ejs", { active : "addAuthor" });
});

app.post('/addAuthor', isUserAuthenticated, async (req, res) => {
  let firstName = req.body.fn;
  let lastName = req.body.ln;
  let birthday = req.body.birthday;
  let deathday = req.body.deathday;
  let sex = req.body.sex;
  let profession = req.body.profession;
  let country = req.body.country;
  let imageUrl = req.body.imageUrl;
  let bio = req.body.bio;
  let sql = `INSERT INTO authors (firstName, lastName, dob, dod, sex, profession, country, portrait, biography) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let sqlParams = [firstName, lastName, birthday, deathday, sex, profession, country, imageUrl, bio];
  const [rows] = await pool.query(sql, sqlParams);
  res.render("home.ejs", { active : "home"});
});

app.get("/dbTest", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT CURDATE()");
    res.send(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Database error!");
  }
});//dbTest

app.listen(3000, () => {
  console.log("Express server running")
})