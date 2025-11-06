import express from 'express';
import mysql from 'mysql2/promise';

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

app.get('/', async (req, res) => {
  res.render("addAuthor.ejs");
});

//  Displays form to add a new author
app.post('/addAuthor', async (req, res) => {
  let firstName = req.body.fn;
  let lastName = req.body.ln;
  let sql = `INSERT INTO authors (firstName, lastName) VALUES (?, ?)`;
  let sqlParams = [firstName, lastName];
  const [rows] = await pool.query(sql, sqlParams);
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