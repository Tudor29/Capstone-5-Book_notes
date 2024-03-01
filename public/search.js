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
            const li = $("<li>").text(book.title);
            li.on("click", function () {
              $("#bookSearch").val(book.title);
              suggestionsList.empty();
            });
            suggestionsList.append(li);
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
});

