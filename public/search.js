$(document).ready(function () {
  $("#bookSearch").on("input", function () {
    const title = $(this).val();
    if (title.length > 2) {
      $.ajax({
        url: `/search?title=${encodeURIComponent(title)}`,
        method: "GET",
        success: function (books) {
          const suggestionsList = $("#suggestionsList");
          suggestionsList.empty();
          books.forEach((book) => {
            const identifier = book.key || book.id;
            const li = $("<li>")
            .html(`<strong>${book.title}</strong><br><span class='author-info'>by ${book.author_name.join(", ")}</span>`)
            .data('key', book.key);
            $('#suggestionsList').append(li);
          });
        },
        error: function (error) {
          console.error("Error fetching suggestions:", error);
        },
      });
    } else {
      $("#suggestionsList").empty();
    }
  });
  $(document).on("click", "#suggestionsList li", function () {
    const bookTitle = $(this).text();
    const identifier = $(this).data("identifier");
    window.location.href = `/new?title=${encodeURIComponent(
      bookTitle
    )}&identifier=${encodeURIComponent(identifier)}`;
  });
});
