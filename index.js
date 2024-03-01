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
    const { rows: bookNotes } = await db.query("SELECT * FROM books");
    const hasNotes = bookNotes.length > 0;
    res.render("index", { bookNotes: bookNotes, hasNotes: hasNotes });
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
  res.json(books.slice(0, 10));
});

app.get("/new", async (req, res) => {
  const { title } = req.query;
  let author = "Author not found";

  if (title) {
    try {
      const apiUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
        title
      )}`;
      const response = await axios.get(apiUrl);
      author =
        response.data.docs[0]?.author_name?.join(", ") || "Author not found";
    } catch (error) {
      console.error("Error fetching author:", error);
    }
  }

  res.render("new", { title: title, author: author });
});

app.post("/add-note", async (req, res) => {
  const { title, notes, rating } = req.body;
  try {
    const apiUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
      title
    )}`;
    const response = await axios.get(apiUrl);
    const author =
      response.data.docs[0]?.author_name?.join(", ") || "Author not found";

    await db.query(
      "INSERT INTO books (title, author, rating, notes) VALUES ($1, $2, $3, $4)",
      [title, author, rating, notes]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Error adding book note:", error);
    res.send("Error adding book note.");
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
