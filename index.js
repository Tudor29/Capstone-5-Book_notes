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
    let bookNotes = await db.query("SELECT * FROM books");
    bookNotes = bookNotes.rows.map((note) => {
      note.coverImgUrl = note.cover_img_id
        ? `https://covers.openlibrary.org/b/id/${note.cover_img_id}-M.jpg`
        : "";
      return note;
    });
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
  let coverImgUrl = "";
  if (title) {
    try {
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
        title
      )}`;
      const searchResponse = await axios.get(searchUrl);
      if (searchResponse.data.docs.length > 0) {
        const firstDoc = searchResponse.data.docs[0];
        author = firstDoc.author_name?.join(", ") || "Author not found";

        if (firstDoc.cover_i) {
          coverImgUrl = `https://covers.openlibrary.org/b/id/${firstDoc.cover_i}-M.jpg`;
        }
      }
    } catch (error) {
      console.error("Error fetching author or cover image:", error);
    }
  }
  res.render("new", { title: title, author: author, coverImgUrl: coverImgUrl });
});

app.post("/add-note", async (req, res) => {
  const { title, notes, rating } = req.body;
  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
      title
    )}`;
    const searchResponse = await axios.get(searchUrl);
    const coverImgId = searchResponse.data.docs[0]?.cover_i;
    const author =
      searchResponse.data.docs[0]?.author_name?.join(", ") ||
      "Author not found";

    await db.query(
      "INSERT INTO books (title, author, rating, notes, cover_img_id) VALUES ($1, $2, $3, $4, $5)",
      [title, author, rating, notes, coverImgId]
    );
    res.redirect("/");
  } catch (error) {
    console.error("Error adding book note:", error);
    res.send("Error adding book note.");
  }
});

app.get("/edit-note/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM books WHERE bood_id = $1", [
      id,
    ]);
    if (result.rows.length > 0) {
      const note = result.rows[0];
      res.render("edit", {
        bood_id: note.bood_id,
        title: note.title,
        author: note.author,
        notes: note.notes,
        rating: note.rating,
        coverImgUrl: note.cover_img_id
          ? `https://covers.openlibrary.org/b/id/${note.cover_img_id}-M.jpg`
          : "",
        editMode: true,
      });
    } else {
      res.send("Note not found.");
    }
  } catch (error) {
    console.error("Error fetching note for editing:", error);
    res.send("Error fetching note for editing.");
  }
});

app.post("/update-note/:id", async (req, res) => {
  const { id } = req.params;
  const { title, notes, rating, author } = req.body;

  try {
    await db.query(
      "UPDATE books SET title = $1, author = $2, notes = $3, rating = $4 WHERE bood_id = $5",
      [title, author, notes, rating, id]
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error updating book note:", error);
    res.status(500).send("Error updating book note.");
  }
});

app.post("/delete-note/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM books WHERE bood_id = $1", [id]);
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting book note:", error);
    res.send("Error deleting book note.");
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
