import 'dotenv/config';
import OpenAI from "openai";
import getGithubUserInfoByUsername from './tools/getGithubUserInfoByUsername.js';
import cloneWebsite from './tools/cloneWebsite.js';

const toolMap = {
    getGithubUserInfoByUsername,
    cloneWebsite
}

const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const systemPrompt = `
    You are an AI assistant that ALWAYS communicates using the strict sequence:
    START → THINK → (optional TOOL → OBSERVE → THINK … repeated as needed) → OUTPUT

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
    - cloneWebsite(url: string): Clones a full website (HTML, CSS, JS, images, icons) into a local folder with paths rewritten.

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
    • "input" MUST be JUST the URL string for website tools (no markdown, no quotes inside quotes beyond JSON).
    - One tool call per assistant turn. After a TOOL step, ALWAYS wait for an OBSERVE step before doing anything else.
    - Keep THINK steps concise but specific (what was done, what's next).
    - Never jump to OUTPUT before attempting at least one TOOL call (unless user explicitly asks for a non-tool response).
    - Do not invent tool results. Only proceed based on OBSERVE content.
    - If a tool returns an error, THINK about a single recovery step (e.g., retry once) or explain the limitation in OUTPUT.
    - Do not include code blocks or non-JSON text in any assistant message.

    EXAMPLES

    Example 1: Cloning
    User: Clone https://example.com
    ASSISTANT: { "step": "START", "content": "User wants a full offline clone of https://example.com." }
    ASSISTANT: { "step": "THINK", "content": "Plan: use cloneWebsite to fetch HTML, CSS, JS, images, and icons in one step." }
    ASSISTANT: { "step": "TOOL", "tool_name": "cloneWebsite", "input": "https://example.com", "content": "Cloning entire site into local folder." }
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



const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "Clone this website https://code.visualstudio.com/" }
];

export default async function agent() {
    try {
        let step = 0;
        while (step < 20) {
            step++;

            const response = await client.chat.completions.create({
                model: 'gemini-2.0-flash',
                response_format: { type: 'json_object' },
                messages
            });

            const rawContent = response.choices[0].message?.content;
            const parsedContent = JSON.parse(rawContent);

            if (!parsedContent) break;

            messages.push({
                role: 'assistant',
                content: JSON.stringify(parsedContent)
            });

            if (parsedContent.step === "START") {
                console.log("🤔 START:", parsedContent.content);
                continue;
            }

            if (parsedContent.step === "THINK") {
                console.log("💭 THINK:", parsedContent.content);
                continue;
            }

            if (parsedContent.step === "TOOL") {
                const toolToCall = parsedContent.tool_name;
                if (!toolMap[toolToCall]) {
                    console.log(`❌ No such tool: ${toolToCall}`);
                    messages.push({
                        role: 'developer',
                        content: `There is no such tool as ${toolToCall}`
                    });
                    continue;
                }

                const responseFromTool = await toolMap[toolToCall](parsedContent.input);
                console.log(`${toolToCall}(${parsedContent.input}) = `, responseFromTool);

                messages.push({
                    role: 'developer',
                    content: JSON.stringify({ step: 'OBSERVE', content: responseFromTool }),
                });
                continue;
            }

            if (parsedContent.step === 'OUTPUT') {
                console.log("✅ OUTPUT:", parsedContent.content);
                break;
            }
        }
        console.log('Done...');
    } catch (error) {
        console.log("Error in agent", error);
    }
}

agent();