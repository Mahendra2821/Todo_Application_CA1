var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch {
    console.log(`Error:${e.message}`);
  }
};
initializeServerAndDatabase();
const convertDbObjectToResponseObject = (dbData) => {
  return {
    id: dbData.id,
    todo: dbData.todo,
    priority: dbData.priority,
    category: dbData.category,
    status: dbData.status,
    dueDate: dbData.due_date,
  };
};

//API 1

app.get("/todos/", async (request, response) => {
  console.log("ENTER!");
  const {
    priority = "",
    status = "",
    category = "",
    search_q = "",
  } = request.query;
  console.log(`priority is ${priority}`);
  console.log(status, category);
  searchQuery = `SELECT * FROM todo WHERE priority LIKE "%${priority}%" AND
      status LIKE "%${status}%" AND category LIKE "%${category}%" AND todo LIKE "%${search_q}%";`;
  const resultArray = await db.all(searchQuery);
  console.log(resultArray.length);
  if (resultArray.length == 0) {
    switch (true) {
      case status.length !== 0:
        response.status(400);
        response.send("Invalid Todo Status");
        break;

      case category.length !== 0:
        response.status(400);
        response.send("Invalid Todo Category");
        break;

      case priority.length !== 0:
        response.status(400);
        response.send("Invalid Todo Priority");
        break;
    }
  } else {
    response.send(
      resultArray.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  }
});
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const resultArray = await db.get(todoQuery);
  response.send(convertDbObjectToResponseObject(resultArray));
});
// app.get("/agenda/", async (request, response) => {
//   console.log(request.query);
//   response.status(400);
//   response.send("Invalid Due Date");
// });
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(request.query);
  const isDateValid = isValid(parseInt(date));
  if (isDateValid) {
    console.log(date);
    dateArray = date.split("-");
    requireDate = format(
      new Date(dateArray[0], parseInt(dateArray[1]) - 1, dateArray[2]),
      "yyyy-MM-dd"
    );
    console.log(`This is ${requireDate}`);

    const searchQuery = `SELECT * FROM todo 
    where due_date="${requireDate}"`;
    const result = await db.all(searchQuery);
    response.send(
      result.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//API 4 POST
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log("POST");
  const isDateValid = isValid(parseInt(dueDate));
  console.log(isDateValid);
  const hasPriority =
    (priority == "HIGH") | (priority == "MEDIUM") | (priority == "LOW");
  const hasStatus =
    (status == "TO DO") | (status == "IN PROGRESS") | (status == "DONE");
  const hasCategory =
    (category == "WORK") | (category == "HOME") | (category == "LEARNING");
  console.log(hasPriority);
  if (hasPriority == 0) {
    response.status(400);
    console.log("Priority");
    response.send("Invalid Todo Priority");
  } else if (hasStatus == 0) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (hasCategory == 0) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isDateValid) {
    dateArray = dueDate.split("-");
    requireDate = format(
      new Date(dateArray[0], parseInt(dateArray[1]) - 1, dateArray[2]),
      "yyyy-MM-dd"
    );
    const postTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, status,category,due_date)
    VALUES
        (${id}, '${todo}', '${priority}', '${status}','${category}','${requireDate}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  console.log(previousTodo);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const isDateValid = isValid(parseInt(dueDate));
  console.log(isDateValid);
  const hasPriority =
    (priority == "HIGH") | (priority == "MEDIUM") | (priority == "LOW");
  const hasStatus =
    (status == "TO DO") | (status == "IN PROGRESS") | (status == "DONE");
  const hasCategory =
    (category == "WORK") | (category == "HOME") | (category == "LEARNING");
  console.log(hasPriority);
  if (hasPriority == 0) {
    response.status(400);
    console.log("Priority");
    response.send("Invalid Todo Priority");
  } else if (hasStatus == 0) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (hasCategory == 0) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isDateValid) {
    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

    await db.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
