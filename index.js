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
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.docs;
  } catch (error) {
    console.error("Could not fetch books:", error);
  }
}





app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
