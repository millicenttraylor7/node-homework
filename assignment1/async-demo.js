const fs = require("fs");
const path = require("path");
const fsPromises = require("fs").promises;

// Write a sample file for demonstration
const dirPath = path.join(__dirname, "sample-files");
const filePath = path.join(dirPath, "sample.txt");

// Create the sample-files folder if it does not exist
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath);
}

// Create sample.txt with the exact required content
fs.writeFileSync(filePath, "Hello, async world!");

// 1. Callback style
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Callback error:", err);
    return;
  }
  console.log("Callback:", data);
});

// Callback hell example (test and leave it in comments):
/*
fs.readFile('file1.txt', 'utf8', (err, data1) => {
  if (err) throw err;

  fs.readFile('file2.txt', 'utf8', (err, data2) => {
    if (err) throw err;

    fs.readFile('file3.txt', 'utf8', (err, data3) => {
      if (err) throw err;

      console.log('Data from file1:', data1);
      console.log('Data from file2:', data2);
      console.log('Data from file3:', data3);
    });
  });
});
*/

// 2. Promise style
fsPromises
  .readFile(filePath, "utf8")
  .then((data) => {
    console.log("Promise:", data);
  })
  .catch((err) => {
    console.error("Promise error:", err);
  });

// 3. Async/Await style
async function readFileAsync() {
  try {
    const data = await fsPromises.readFile(filePath, "utf8");
    console.log("Async/Await:", data);
  } catch (err) {
    console.error("Async/Await Error:", err);
  }
}

readFileAsync();
