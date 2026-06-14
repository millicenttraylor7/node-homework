const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node Homework API",
      version: "1.0.0",
      description: "API documentation for the Node Homework backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
      {
        url: "https://node-homework-uyct.onrender.com",
        description: "Render deployed server",
      },
    ],
  },
  apis: ["./routers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
