const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module
const joinedPath = path.join("/path/to/sample-files", "folder", "file.txt");
console.log("Joined path:", joinedPath.replace(/\\/g, "/"));

// fs.promises API
const fsPromises = fs.promises;
const demoFilePath = path.join(__dirname, "demo.txt");
const largeFilePath = path.join(sampleFilesDir, "largefile.txt");

// Create largefile.txt with many lines
let largeContent = "";
for (let i = 1; i <= 100; i++) {
  largeContent += "This is a line in a large file...\n";
}
fs.writeFileSync(largeFilePath, largeContent);

async function fileDemo() {
  try {
    await fsPromises.writeFile(demoFilePath, "Hello from fs.promises!");
    const data = await fsPromises.readFile(demoFilePath, "utf8");
    console.log("fs.promises read:", data);

    // Streams for large files - log first 40 chars of each chunk
    const readStream = fs.createReadStream(largeFilePath, {
      encoding: "utf8",
      highWaterMark: 1024,
    });

    readStream.on("data", (chunk) => {
      const firstLine = chunk.split("\n")[0];
      console.log("Read chunk:", firstLine.slice(0, 40));
    });

    readStream.on("end", () => {
      console.log("Finished reading large file with streams.");
    });

    readStream.on("error", (err) => {
      console.error("Stream error:", err);
    });
  } catch (err) {
    console.error("fs.promises error:", err);
  }
}

fileDemo();
