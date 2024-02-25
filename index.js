import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "capstone5",
  password: process.env.DB_PASSWORD,
  port: 5432,
});
db.connect();

async function fetchBooksByTitle(title) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(
    title
  )}`;
  try {
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.data.docs;
  } catch (error) {
    console.error("Could not fetch books:", error);
  }
}

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books");
    const hasNotes = result.rows.length > 0;
    res.render("index", { bookNotes: result.rows, hasNotes: hasNotes });
  } catch (error) {
    console.error("Database error:", error);
    res.send("Error fetching book notes.");
  }
});

app.get("/search", async (req, res) => {
  if (!req.query.title) {
    return res.json([]);
  }
  const books = await fetchBooksByTitle(req.query.title);
  res.json(books);
});

app.post("/new", async (req, res) => {
  const { title, author, note } = req.body;
  try {
    await db.query(
      "INSERT INTO books (title, author, notes) VALUES ($1, $2, $3)",
      [title, author, note]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Database error:", error);
    res.send("Error adding book note.");
  }
});




app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
