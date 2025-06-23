import fs from "fs";
import path from "path";

// Get desktop path
const desktopPath = path.join(process.env.USERPROFILE, "Desktop");

// Define .bat file content
const batContent = `@echo off
cd /d D:\\build-letter
yarn start
pause
`;

// Save as a .bat file
const batFilePath = path.join(desktopPath, "start-letter-app.bat");

fs.writeFileSync(batFilePath, batContent, "utf8");

console.log("BAT file created at:", batFilePath);
