import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import agent from './agent.js';
import webAgent from './webAgent.js';

const displayWelcome = () => {
    console.clear();

    try {
        // Create ASCII art for CHAICODE CLI
        const title = figlet.textSync('CHAICODE', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        });

        console.log(chalk.cyan(title));
    } catch (error) {
        // Fallback if figlet fails
        console.log(chalk.cyan.bold('\n🚀 CHAICODE CLI 🚀\n'));
    }

    console.log(chalk.yellow.bold('                    CLI TOOLKIT\n'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log(chalk.green('🚀 Welcome to ChaiCode CLI - Your Development Companion'));
    console.log(chalk.gray('━'.repeat(60)));
    console.log();
};

// Main menu options
const mainMenuChoices = [
    {
        name: chalk.blue('🌐 Clone a website') + chalk.gray(' - Extract and replicate any website'),
        value: 'clone',
        short: 'Clone Website'
    },
    {
        name: chalk.magenta('🏗️  Build a website') + chalk.gray(' - Create a new website with HTML/CSS/JS'),
        value: 'build',
        short: 'Build Website'
    },
    {
        name: chalk.red('❌ Exit'),
        value: 'exit',
        short: 'Exit'
    }
];

// Handle website cloning task
const handleCloneWebsite = async () => {
    console.log(chalk.blue.bold('\n🌐 WEBSITE CLONING TOOL\n'));
    console.log(chalk.gray('━'.repeat(40)));

    const cloneQuestions = [
        {
            type: 'input',
            name: 'url',
            message: chalk.cyan('Enter the website URL to clone:'),
            validate: (value) => {
                const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                if (!value) {
                    return chalk.red('Please enter a URL');
                }
                if (!urlPattern.test(value)) {
                    return chalk.red('Please enter a valid URL (e.g., https://example.com)');
                }
                return true;
            }
        }
    ];

    try {
        const answers = await inquirer.prompt(cloneQuestions);

        console.log(chalk.yellow('\n⏳ Processing your request...'));

        await agent(`The user wants to clone this website ${answers.url}`);

        console.log(chalk.green.bold('\n✅ SUCCESS!'));
        console.log(chalk.green(`🎉 Website cloning initiated successfully!`));
        console.log(chalk.gray(`URL: ${answers.url}`));

    } catch (error) {
        console.log(chalk.red('\n❌ Operation cancelled'));
    }
};

// Handle website building task
const handleBuildWebsite = async () => {
    console.log(chalk.magenta.bold('\n🏗️ WEBSITE BUILDER TOOL\n'));
    console.log(chalk.gray('━'.repeat(40)));

    const buildQuestions = [
        {
            type: 'input',
            name: 'projectName',
            message: chalk.cyan('Enter project name:'),
            validate: (value) => {
                if (!value || value.trim() === '') {
                    return chalk.red('Please enter a project name');
                }
                return true;
            }
        },
        {
            type: 'input',
            name: 'projectDescription',
            message: chalk.cyan('Enter project description:'),
            validate: (value) => {
                if (!value || value.trim() === '') {
                    return chalk.red('Please enter a project description');
                }
                return true;
            }
        },
    ];

    try {
        const answers = await inquirer.prompt(buildQuestions);

        console.log(chalk.yellow('\n⏳ Building your website...'));

        await webAgent(`The user wants to create a website ${answers.projectName} and the description of the website is ${answers.projectDescription}`)

        console.log(chalk.green.bold('\n✅ SUCCESS!'));
        console.log(chalk.green(`🎉 Website building initiated successfully!`));
        console.log(chalk.gray(`Project: ${answers.projectName}`));
        if (answers.projectDescription) {
            console.log(chalk.gray(`Description: ${answers.description}`));
        }
    } catch (error) {
        console.log(chalk.red('\n❌ Operation cancelled'));
    }
};

// Main function
const main = async () => {
    try {
        displayWelcome();

        while (true) {
            try {
                const mainAnswer = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'task',
                        message: chalk.yellow.bold('What would you like to do today?'),
                        choices: mainMenuChoices,
                        pageSize: 10
                    }
                ]);

                switch (mainAnswer.task) {
                    case 'clone':
                        await handleCloneWebsite();
                        break;
                    case 'build':
                        await handleBuildWebsite();
                        break;
                    case 'exit':
                        console.log(chalk.cyan('\n👋 Thanks for using ChaiCode CLI!'));
                        console.log(chalk.gray('Happy coding! 🚀\n'));
                        process.exit(0);
                    default:
                        console.log(chalk.red('Invalid option selected'));
                }

                // Ask if user wants to continue
                const continueAnswer = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'continue',
                        message: chalk.yellow('\nWould you like to perform another task?'),
                        default: true
                    }
                ]);

                if (!continueAnswer.continue) {
                    console.log(chalk.cyan('\n👋 Thanks for using ChaiCode CLI!'));
                    console.log(chalk.gray('Happy coding! 🚀\n'));
                    break;
                }

                console.clear();
                displayWelcome();

            } catch (error) {
                if (error.isTtyError) {
                    console.log(chalk.red('Prompt couldn\'t be rendered in the current environment'));
                } else {
                    console.log(chalk.red('\n❌ Something went wrong. Exiting...'));
                    console.error('Error:', error.message);
                }
                break;
            }
        }
    } catch (error) {
        console.error('Failed to start CLI:', error.message);
        process.exit(1);
    }
};

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

main();

export { main };