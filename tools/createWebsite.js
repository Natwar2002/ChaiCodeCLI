import { exec } from "child_process";
import fs from "fs";
import path from "path";

async function executeCommand(cmd = "") {
    return new Promise((resolve, reject) => {
        console.log(`🔄 Executing: ${cmd}`);
        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}\nStderr: ${stderr}`);
            } else {
                const output = stdout || stderr || "Command executed successfully";
                resolve(output.trim());
            }
        });
    });
}

async function createDirectory(dirPath = "") {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                resolve(`Directory created: ${dirPath}`);
            } else {
                resolve(`Directory already exists: ${dirPath}`);
            }
        } catch (error) {
            reject(`Error creating directory: ${error.message}`);
        }
    });
}


async function writeFile(filePath = "", content = "") {
    return new Promise((resolve, reject) => {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, content, 'utf8');
            resolve(`File created: ${filePath} (${content.length} characters)`);
        } catch (error) {
            reject(`Error writing file: ${error.message}`);
        }
    });
}


async function readFile(filePath = "") {
    return new Promise((resolve, reject) => {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                resolve(content);
            } else {
                reject(`File not found: ${filePath}`);
            }
        } catch (error) {
            reject(`Error reading file: ${error.message}`);
        }
    });
}

async function listDirectory(dirPath = ".") {
    return new Promise((resolve, reject) => {
        try {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                resolve(`Directory contents of ${dirPath}:\n${files.join('\n')}`);
            } else {
                reject(`Directory not found: ${dirPath}`);
            }
        } catch (error) {
            reject(`Error listing directory: ${error.message}`);
        }
    });
}

async function checkExists(filePath = "") {
    return new Promise((resolve) => {
        const exists = fs.existsSync(filePath);
        const type = exists ? (fs.statSync(filePath).isDirectory() ? 'directory' : 'file') : 'not found';
        resolve(`${filePath}: ${exists ? 'exists' : 'does not exist'} (${type})`);
    });
}

export { executeCommand, createDirectory, writeFile, readFile, listDirectory, checkExists }