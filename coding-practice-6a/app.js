const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running...!");
    });
  } catch (e) {
    console.log(`DB error '${e.massage}'`);
    process.exit(1);
  }
};

initializeDBAndServer();

// //API-1 list all the states
const snakeCaseToCamelCaseForStates = (stateObject) => {
  return {
    stateId: stateObject.state_id,
    stateName: stateObject.state_name,
    population: stateObject.population,
  };
};

app.get("/states/", async (req, res) => {
  const allStatesDBQuery = `select * from state order by state_id;`;
  const allStatesArray = await db.all(allStatesDBQuery);
  res.send(allStatesArray.map((each) => snakeCaseToCamelCaseForStates(each)));
});

//API-2 particular state by stateId
app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const stateDBQuery = `select * from state where 
    state_id = '${stateId}';`;
  const state = await db.get(stateDBQuery);
  res.send(snakeCaseToCamelCaseForStates(state));
});

//API-3 create district
app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const insertDBQuery = `insert into district 
  (district_name, state_id, cases, cured, active, deaths )
  values ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}' );`;
  await db.run(insertDBQuery);
  res.send("District Successfully Added");
});

//API-4 return district based on district
const snakeCaseToCamelCaseForDistrict = (dObject) => {
  return {
    districtId: dObject.district_id,
    districtName: dObject.district_name,
    stateId: dObject.state_id,
    cases: dObject.cases,
    cured: dObject.cured,
    active: dObject.active,
    deaths: dObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const dbSelectQuery = `select * from district where district_id = '${districtId}';`;
  const districtDetails = await db.get(dbSelectQuery);
  response.send(snakeCaseToCamelCaseForDistrict(districtDetails));
});

//API-5 delete particular district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDBQuery = `delete from district where district_id = '${districtId}';`;
  await db.run(deleteDBQuery);
  response.send("District Removed");
});

//API-6 update particular district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `update district set 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    where district_id = '${districtId}';
    `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API-7 Path: /states/:stateId/stats/
// Method: GET
// Description:
// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

// Response
// {
//   totalCases: 724355,
//   totalCured: 615324,
//   totalActive: 99254,
//   totalDeaths: 9777
// }

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statDBQuery = `select sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths from district 
     where state_id = '${stateId}';`;
  const stats = await db.get(statDBQuery);
  response.send(stats);
});

//API -8 list state followed by  district
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const selectDBQuery = `select state.state_name from district inner join state on 
    district.state_id = state.state_id where district.district_id = '${districtId}';`;
  const stateResult = await db.get(selectDBQuery);
  response.send({ stateName: stateResult.state_name });
});

module.exports = app;
