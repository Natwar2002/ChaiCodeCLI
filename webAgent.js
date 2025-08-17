import "dotenv/config";
import { OpenAI } from "openai";
import {
    executeCommand,
    createDirectory,
    writeFile,
    readFile,
    listDirectory,
    checkExists,
} from "./tools/createWebsite.js";

const TOOL_MAP = {
    executeCommand,
    createDirectory,
    writeFile,
    readFile,
    listDirectory,
    checkExists,
};

const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function main() {
    const SYSTEM_PROMPT = `
        You are an expert AI assistant that builds websites using HTML, CSS (Tailwind), and JS.

        CRITICAL INSTRUCTIONS:
        - You MUST respond with EXACTLY ONE JSON object per message
        - NEVER respond with arrays, multiple objects, or nested structures
        - Each response should be a single JSON object like: {"step": "...", "content": "..."}
        - Only use these exact steps: START, THINK, TOOL, OUTPUT
        - Never use OBSERVE, FINISH, or any other steps
        - Always provide your next action, never repeat previous observations

        Available Tools (use exact names):
        - createDirectory: Create a directory
        - writeFile: Write content to a file (use format: {filePath, content})
        - executeCommand: Execute a shell command
        - readFile: Read a file's content
        - listDirectory: List directory contents
        - checkExists: Check if file/folder exists

        RESPONSE FORMAT (single JSON object only):
        {"step": "START", "content": "description of what you will do"}
        {"step": "THINK", "content": "understand what to build"}
        {"step": "THINK", "content": "understand which tool you need"}
        {"step": "TOOL", "tool_name": "toolName", "input": "parameters"}
        {"step": "OUTPUT", "content": "final completion message"}

        Application Build Rules (HTML/CSS(Tailwind)/JS):
        {"step": "START", "content": "description of what you will do"}
        {"step": "THINK", "content": "I have to create a folder Directory"}
        {"step": "TOOL", "tool_name": "createDirectory", "input": "folder"}
        {"step": "THINK", "content": "Now I have to create HTML and JS files index.html and script.js"}
        {"step": "TOOL", "tool_name": "writeFile", "input": {"filePath":"folder/index.html","content":"<html>...</html>"}}
        {"step": "TOOL", "tool_name": "writeFile", "input": {"filePath":"folder/script.js","content":"console.log('ready');"}}
        {"step": "OUTPUT", "content": "final completion message"}

        IMPORTANT:
        - Include proper error handling
        - Always make the UI responsive and modern-looking
        - Always use a new folder when building a new application
    `;

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
            role: "user",
            content: "Make an image carousel and for images take divs of multiple colors with height and width",
        },
    ];

    let stepCount = 0;
    const maxSteps = 10;

    while (stepCount < maxSteps) {
        stepCount++;

        try {
            const response = await client.chat.completions.create({
                model: "gemini-2.0-flash",
                response_format: { type: "json_object" },
                messages,
                temperature: 0.3,
                max_tokens: 2000,
            });

            const rawContent = response.choices[0].message.content;
            console.log(`\n! Raw response: ${rawContent.substring(0, 200)}...`);

            const parsedContent = JSON.parse(rawContent);
            if (!parsedContent) {
                console.log("- Could not parse response. Stopping.");
                break;
            }

            parsedContent.step = parsedContent.step?.toUpperCase();

            messages.push({ role: "assistant", content: JSON.stringify(parsedContent) });

            console.log(`\n> Step ${stepCount}: ${parsedContent.step}`);

            if (parsedContent.step === "START") {
                console.log(`@ START:`, parsedContent.content);
                continue;
            }

            if (parsedContent.step === "THINK") {
                console.log(`?? THINK:`, parsedContent.content);
                continue;
            }

            if (parsedContent.step === "TOOL") {
                const toolToCall = parsedContent.tool_name;
                const input = parsedContent.input;

                if (!TOOL_MAP[toolToCall]) {
                    console.log(`❌ Unknown tool: ${toolToCall}`);
                    messages.push({
                        role: "user",
                        content: `ERROR: Tool '${toolToCall}' not available. Available tools: ${Object.keys(
                            TOOL_MAP
                        ).join(", ")}.`,
                    });
                    continue;
                }

                try {
                    console.log(`- Running tool: ${toolToCall}`);
                    const result = Array.isArray(input)
                        ? await TOOL_MAP[toolToCall](...input)
                        : await TOOL_MAP[toolToCall](input.filePath ?? input, input.content);
                    console.log(`✔ Tool executed: ${result}`);
                } catch (error) {
                    console.log(`❌ Tool error in ${toolToCall}:`, error.message);
                }
            }

            if (parsedContent.step === "OUTPUT") {
                console.log(`- OUTPUT:`, parsedContent.content);
                break;
            }
        } catch (error) {
            console.log(`- API Error:`, error.message);
            messages.push({
                role: "user",
                content: "There was an API error. Please continue with the next step.",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    if (stepCount >= maxSteps) {
        console.log(`- Reached maximum steps (${maxSteps}). Process terminated.`);
    }

    console.log("\n- Process completed!");
    console.log("- Check the folder for your files.");
    console.log("- Open app/index.html in your browser to test the app.");
}

// Error handling
process.on("uncaughtException", (error) => {
    console.error("- Uncaught Exception:", error.message);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("- Unhandled Rejection:", reason);
    process.exit(1);
});

main().catch((error) => {
    console.error("- Main function error:", error.message);
    process.exit(1);
});