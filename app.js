const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Returns a list of all movie names in the movie table

app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `
        SELECT 
            movie_name 
        FROM
            movie;
        `;
  const movieNamesQuery = await db.all(getMovieNamesQuery);
  response.send(movieNamesQuery);
});

//Creates a new movie in the movie table. movie_id is auto-incremented

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;

  const createDataQuery = `
        INSERT INTO
          movie ( director_id, movie_name, lead_actor )
        VALUES 
          (${directorId},'${movieName}','${leadActor}');`;

  await db.run(createDataQuery);
  response.send(`Movie Successfully Added`);
});

//Returns a movie based on the movie ID

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT 
            *
        FROM 
            movie
        WHERE 
            movie_id = ${movieId};`;

  const movie = await db.get(getMovieQuery);
  response.send(convertMovieDbObjectToResponseObject(movie));
});

//Updates the details of a movie in the movie table based on the movie ID

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;

  const updateQuery = `
        UPDATE 
            movie
        SET
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE
            movie_id = ${movieId};`;

  await db.run(updateQuery);

  response.send("Movie Details Updated");
});

//Deletes a movie from the movie table based on the movie ID

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        movie
    WHERE
        movie_id = ${movieId};`;
  await db.run(deleteQuery);
  response.send(`Movie Removed`);
});

//Returns a list of all directors in the director table

app.get("/directors/", async (request, response) => {
  const getAllDirectors = `
        SELECT 
            *
        FROM
            director;`;

  const directorsList = await db.all(getAllDirectors);
  response.send(
    directorsList.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

//Returns a list of all movie names directed by a specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
        SELECT 
            movie_name
        FROM 
            movie
        WHERE
            director_id = ${directorId};`;

  const directorMovies = await db.all(getDirectorMoviesQuery);
  response.send(
    directorMovies.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});
module.exports = app;
