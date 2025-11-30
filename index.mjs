import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

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

app.get('/addQuote', async (req, res) => {
  //  search by author
  let authorsSql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authorRows] = await pool.query(authorsSql);
  //  search by category
  let categoriesSql = "SELECT DISTINCT category FROM quotes;";
  const [categoriesRows] = await pool.query(categoriesSql);
  res.render("newQuote.ejs", { authorRows, categoriesRows });
});

app.get('/', async (req, res) => {
  res.render("home.ejs");
});

//  displays form to update quote
app.get('/updateQuote', async (req, res) => {
  let quoteId = req.query.quoteId;
  let sql = `SELECT * FROM quotes WHERE quoteId = ?`;
  const [quoteInfo] = await pool.query(sql, [quoteId]);
  //  search by author
  let authorsSql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authorRows] = await pool.query(authorsSql);
  //  search by category
  let categoriesSql = "SELECT DISTINCT category, quoteId FROM quotes;";
  const [categoriesRows] = await pool.query(categoriesSql);
  res.render("updateQuote.ejs", {quoteInfo, authorRows, categoriesRows});
});

app.post('/updateAuthor', async (req, res) => {
  let fName = req.body.fn;
  let lName = req.body.ln;
  let authorId = req.body.authorId;
  let sql = `UPDATE authors SET firstName = ?, lastName = ? WHERE authorId = ?`;
  let sqlParams = [fName, lName, authorId];
  const [row] = await pool.query(sql, sqlParams);
  res.redirect("/allAuthors");
});

// display form to update author info
app.get('/updateAuthor', async (req, res) => {
  let authorId = req.query.id;
  let sql = `SELECT *,
            DATE_FORMAT(dob, '%Y-%m-%d') ISOdob,
            DATE_FORMAT(dod, '%Y-%m-%d') ISOdod
            FROM authors 
            WHERE authorId = ?`;
  const [authorInfo] = await pool.query(sql, [authorId]);
  res.render("updateAuthor.ejs", {authorInfo});
});

app.get('/allAuthors', async (req, res) => {
  let sql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authors] = await pool.query(sql);
  res.render("allAuthors.ejs", {authors});
});

app.get('/allQuotes', async (req, res) => {
  let sql = `SELECT quoteId, quote
              FROM quotes`;
  const [quotes] = await pool.query(sql);
  res.render("allQuotes.ejs", {quotes});
});

app.post('/addAuthorQuoteByCategory', async (req, res) => {
  let authorId = req.body.authorId;
  let cat = req.body.category;
  let quote = req.body.quote;
  let sql = `INSERT INTO quotes (quote, authorId, category) VALUES (?, ?, ?)`;
  let sqlParams = [quote, authorId, cat];
  const [rows] = await pool.query(sql, sqlParams);
  //  search by author
  let authorsSql = "SELECT authorId, firstName, lastName FROM authors ORDER BY lastName";
  const [authorRows] = await pool.query(authorsSql);
  //  search by category
  let categoriesSql = "SELECT DISTINCT category FROM quotes;";
  const [categoriesRows] = await pool.query(categoriesSql);
  res.render("newQuote.ejs", { authorRows, categoriesRows });
});

//  Displays form to add a new author
app.post('/addAuthor', async (req, res) => {
  let firstName = req.body.fn;
  let lastName = req.body.ln;
  let sex = req.body.sex;
  let birthday = req.body.birthday;
  let deathday = req.body.deathday;
  let bio = req.body.bio;
  let imageUrl = req.body.imageUrl;
  let sql = `INSERT INTO authors (firstName, lastName, dob, dod, sex, portrait, biography) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  let sqlParams = [firstName, lastName, birthday, deathday, sex, imageUrl, bio];
  const [rows] = await pool.query(sql, sqlParams);
  res.render("addAuthor.ejs");
});

app.get('/addAuthor', async (req, res) => {
  res.render("addAuthor.ejs");
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