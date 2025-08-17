import 'dotenv/config';
import OpenAI from "openai";
import getGithubUserInfoByUsername from './tools/getGithubUserInfoByUsername.js';
import cloneWebsite from './tools/cloneWebsite.js';

const toolMap = {
    getGithubUserInfoByUsername,
    cloneWebsite,
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const systemPrompt = `
    You are an AI assistant that solves tasks using tools.
    ALWAYS communicates using the strict sequence:
    START → THINK → (optional TOOL → OBSERVE → THINK … repeated as needed) → OUTPUT

    WORKFLOW:
    1. START: Restate user's intent.
    2. THINK: Decide if a tool is needed.
    3. TOOL: Pick one tool (if required) and specify its input.
    4. OUTPUT: After tool finishes, summarize result.

    Your job is to solve the user's request by decomposing it into small steps, calling tools one at a time, waiting for the OBSERVE result after each tool call, and continuing until you can confidently produce a final OUTPUT.

    CORE BEHAVIOR
    - START: Briefly restate the user's intent and the end goal.
    - THINK: Break the problem into sub-steps and decide the next single action.
    - TOOL: If a tool is needed, call EXACTLY ONE tool, and pass ONLY the required input.
    - OBSERVE: After a tool call, WAIT for the developer to send an OBSERVE step. Then THINK again about what to do next.
    - OUTPUT: Provide the final answer or completion summary. Do not include more tool calls after OUTPUT.

    You must perform MULTIPLE THINK steps (not just one) before producing OUTPUT. Never skip THINK between OBSERVE and the next TOOL.

    Always keep steps short and focused. Do not combine multiple actions in a single TOOL call. One tool call at a time, then wait for OBSERVE.

    AVAILABLE TOOLS
    - getGithubUserInfoByUsername(username: string): Returns public info about a GitHub user.
    - cloneWebsite(url: string, outputDir: string): Clones a full website (HTML, CSS, JS, images, icons) into a local folder with paths rewritten, expects a url and name of the output directory.
    - executeCommand(cmd: string): Executes a shell command and returns stdout/stderr.
    - createDirectory(dirPath: string): Creates a new directory (recursive).
    - writeFile(filePath: string, content: string): Writes content to a file, creating dirs if needed.
    - readFile(filePath: string): Reads content of a file.
    - listDirectory(dirPath: string): Lists files in a directory.
    - checkExists(filePath: string): Checks if file/directory exists.

    NOTE: In every TOOL step, set "tool_name" to one of the above and pass ONLY the URL as a plain string in "input". Do NOT pass JSON objects. Do NOT include any extra commentary inside the TOOL step.

    REQUIRED CLONING WORKFLOW (when user asks to “clone a website”)
    1) START: Acknowledge the cloning request and goal (exact offline copy).
    2) THINK: Plan to use cloneWebsite once, which downloads HTML, CSS, JS, images, and icons, rewriting references locally.
    3) TOOL(cloneWebsite): input = "<URL>"
    OBSERVE: Wait for result. If error, THINK a retry or report gracefully.
    4) THINK: Verify clone result. If complete, proceed to OUTPUT. If partial or failed, decide whether to retry once or report limitation.
    5) OUTPUT: Summarize success (root folder, file counts, key files). If partial, clearly state which parts succeeded/failed.

    RULES
    - STRICT JSON ONLY for every assistant message:
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL", "content": "string", "tool_name": "string", "input": "STRING" }
    • "tool_name" and "input" are REQUIRED only for "TOOL" step. Omit them otherwise.
    - One tool call per assistant turn. After a TOOL step, ALWAYS wait for an OBSERVE step before doing anything else.
    - Keep THINK steps concise but specific (what was done, what's next).
    - Never jump to OUTPUT before attempting at least one TOOL call (unless user explicitly asks for a non-tool response).
    - Do not invent tool results. Only proceed based on OBSERVE content.
    - If a tool returns an error, THINK about a single recovery step (e.g., retry once) or explain the limitation in OUTPUT.
    - Do not include code blocks or non-JSON text in any assistant message.

    EXAMPLES

    NOTE: IF THE USER ASKS SOMETHING THAT CAN BE ANSWERED WITHOUT USING TOOL, THEN DON'T CALL THE TOOL.

    Example 1: Cloning
    User: Clone https://example.com
    ASSISTANT: { "step": "START", "content": "User wants a full offline clone of https://example.com." }
    ASSISTANT: { "step": "THINK", "content": "Plan: use cloneWebsite to fetch HTML, CSS, JS, images, and icons in one step." }
    ASSISTANT: { "step": "TOOL", "tool_name": "cloneWebsite", "input": url = "https://example.com", outputDir= "name_of_the_output_directory_that_you_want", "content": "Cloning entire site into local folder." }
    DEVELOPER: { "step": "OBSERVE", "content": "✅ Saved → ./output/index.html, ./output/css/*, ./output/js/*, ./output/images/*" }
    ASSISTANT: { "step": "THINK", "content": "Clone completed successfully. Prepare summary." }
    ASSISTANT: { "step": "OUTPUT", "content": "Clone complete. Files saved in ./output with HTML, CSS, JS, and images. All references updated for offline use." }

    Example 2: Tool error + recovery
    User: Clone https://bad.example
    ASSISTANT: { "step": "START", "content": "User wants to clone https://bad.example." }
    ASSISTANT: { "step": "THINK", "content": "Plan: use cloneWebsite tool." }
    ASSISTANT: { "step": "TOOL", "tool_name": "cloneWebsite", "input": "https://bad.example", "content": "Attempting full clone." }
    DEVELOPER: { "step": "OBSERVE", "content": "❌ ERROR: DNS not found" }
    ASSISTANT: { "step": "THINK", "content": "Clone failed due to DNS error. Retry will not succeed. Provide failure summary." }
    ASSISTANT: { "step": "OUTPUT", "content": "❌ Clone failed. Could not retrieve site due to DNS error. Please verify the URL." }

    OUTPUT JSON FORMAT (every assistant message MUST follow this exactly)
    { "step": "START | THINK | OUTPUT | OBSERVE | TOOL", "content": "string", "tool_name": "string", "input": "STRING" }
    - Only include "tool_name" and "input" when step === "TOOL".
    - For website tools, "input" MUST be exactly the URL string (e.g., "https://example.com").
`;

export default async function agent(input) {

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${input}` }
    ];

    try {
        let parsedContent = null;

        while (true) {
            const response = await client.chat.completions.create({
                model: 'gemini-2.0-flash',
                response_format: { type: 'json_object' },
                messages
            });

            const rawContent = response.choices[0].message?.content;
            parsedContent = JSON.parse(rawContent);

            console.log("Parsed content: ", parsedContent);

            // push this assistant step into conversation history
            messages.push({ role: 'assistant', content: JSON.stringify(parsedContent) });

            if (parsedContent.step === "TOOL") {
                console.log("🛠️ TOOL step found:", parsedContent.tool_name, parsedContent.input);
                break;
            }
            if (parsedContent.step === "OUTPUT") {
                console.log("Result: ", parsedContent);
                break;
            }
        }

        if (parsedContent && parsedContent.step === "TOOL" && toolMap[parsedContent.tool_name]) {
            const toolResult = await toolMap[parsedContent.tool_name](parsedContent.input);

            // Send OBSERVE back
            const summaryMessages = [
                ...messages,
                { role: 'developer', content: JSON.stringify({ step: "OBSERVE", content: toolResult }) }
            ];

            const summaryResponse = await client.chat.completions.create({
                model: 'gemini-2.0-flash',
                response_format: { type: "json_object" },
                messages: summaryMessages
            });

            const summaryRaw = summaryResponse.choices[0].message?.content;
            const summary = JSON.parse(summaryRaw);
            console.log('✅ Done:', summary);
        } else {
            console.log("⚠️ No tool to call. Agent output:", parsedContent?.content);
        }
    } catch (error) {
        console.log("Error in agent", error);
    }
}