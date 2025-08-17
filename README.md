# 🚀 ChaiCode CLI – Website Cloner & Builder

ChaiCode CLI is a developer-friendly **command-line toolkit** powered by AI agents.  
It allows you to:

- 🌐 **Clone any website pixel-to-pixel** (HTML, CSS, JS, images, videos).  
- 🏗️ **Generate a brand-new website** from scratch using simple prompts.  

This project combines **automation, AI-driven workflows, and developer tools** into one powerful CLI.

## ⚡ Setup & Installation

**Clone this repository**

  create a .env file in the root dir and write your API key.
  OPENAI_API_KEY="your_api_key"    (If you're using any API key other then gemini, then change the model in the agent and webAgent)

   ```bash
   git clone https://github.com/Natwar2002/ChaiCodeCLI.git
   cd ChaiCodeCLI
   
   npm install
   npm start
   ```

---

## ✨ Features

### 🌐 Website Cloner
- Clone any website **pixel-to-pixel**.  
- Downloads and organizes:
  - CSS files  
  - JavaScript files  
  - Images  
  - Videos  
- Cleans and rewrites file paths for **local offline use**.  
- Outputs a fully working `index.html` with assets.

### 🏗️ Website Builder
- Create a new project with **AI-powered scaffolding**.  
- Generate:
  - Project directories  
  - HTML, CSS, JS files  
  - Starter templates for faster development  
- Manage your files with helper tools:
- `createDirectory`
  - `writeFile`
  - `readFile`
  - `listDirectory`
  - `checkExists`
  - `executeCommand`

### 🎨 CLI Interface
- Interactive prompts using [Inquirer.js](https://www.npmjs.com/package/inquirer).  
- Beautiful UI with:
  - [Chalk](https://www.npmjs.com/package/chalk) for colors  
  - [Figlet](https://www.npmjs.com/package/figlet) for ASCII banners  
- Simple **menu-driven navigation**.  

---

## 🛠️ Tech Stack

- **Node.js** (runtime)  
- **Cheerio** – HTML parsing & manipulation  
- **Axios** – HTTP requests  
- **js-beautify** – Code formatting (CSS & JS)  
- **Inquirer** – Interactive CLI  
- **Chalk** – Colorful console output  
- **Figlet** – ASCII art banners  
