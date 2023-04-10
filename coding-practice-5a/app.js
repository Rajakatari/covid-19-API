const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
app.use(express.json());
db = null;

//initioalizing DB and Server

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running...!");
    });
  } catch (e) {
    console.log(`DB error '${e.message}'`);
  }
};

initializeDBAndServer();

//change snake case to CamelCase
const changingSnakeCaseToCamelCase = (movieObject) => {
  return {
    movieId: movieObject.movie_id,
    directorId: movieObject.director_id,
    movieName: movieObject.movie_name,
    leadActor: movieObject.lead_actor,
  };
};

//change snake case to CamelCase for directors
const snakeCaseToCamelCaseForDirectors = (movieObject) => {
  return {
    movieName: movieObject.movie_name,
  };
};
//API-1 get all movies details
app.get("/movies/", async (request, response) => {
  const allMoviesDetails = `select movie_name from movie order by movie_id`;
  const allMovies = await db.all(allMoviesDetails);
  response.send(
    allMovies.map((eachObject) => changingSnakeCaseToCamelCase(eachObject))
  );
});

//API-2 create a  movie
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const insertDbQuery = `insert into movie (director_id,movie_name,lead_actor) values('${directorId}','${movieName}','${leadActor}') ;`;
  await db.run(insertDbQuery);
  response.send("Movie Successfully Added");
});

//API-3 get details of particular movie details
app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const dbSelectQuery = `select * from movie where movie_id = '${movieId}';`;
    const movieDetails = await db.get(dbSelectQuery);
    response.send(changingSnakeCaseToCamelCase(movieDetails));
  } catch (e) {
    response.send(`DB error '${e.message}'`);
  }
});

//API-4 update particular movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const dbUpdateQuery = `update movie set director_id = '${directorId}',
    movie_name ='${movieName}',lead_actor = '${leadActor}' where movie_id = '${movieId}';`;
  await db.run(dbUpdateQuery);
  response.send("Movie Details Updated");
});

//API-5 delete particular movie details
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteDBQuery = `delete from movie where movie_id = '${movieId}';`;
  await db.run(deleteDBQuery);
  response.send("Movie Removed");
});

const snakeCaseToCamelCaseForDirectorList = (directorObject) => {
  return {
    directorId: directorObject.director_id,
    directorName: directorObject.director_name,
  };
};

//API-6 list all directors
app.get("/directors/", async (request, response) => {
  const selectAllDBQuery = `select * from director order by director_id;`;
  const directorArray = await db.all(selectAllDBQuery);
  response.send(
    directorArray.map((each) => snakeCaseToCamelCaseForDirectorList(each))
  );
});

//API-7 get director movies
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const innerJoinDBQuery = `select b.movie_name from director as a inner join movie as b on a.director_id = b.director_id
    where a.director_id = '${directorId}';`;
  const directorsMoviesArray = await db.all(innerJoinDBQuery);
  response.send(
    directorsMoviesArray.map((eachObject) =>
      snakeCaseToCamelCaseForDirectors(eachObject)
    )
  );
});

module.exports = app;
