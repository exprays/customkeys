#!/usr/bin/env node

const { program } = require('commander');

// Simple ANSI color wrapper
const chalk = {
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

program
  .name('nan0')
  .description('Nano platform CLI')
  .version('0.1.0');

// Auth Subcommand
const authCommand = program.command('auth').description('Authentication commands');
authCommand
  .command('login')
  .description('Authenticate with your account')
  .action(async () => {
    console.log(chalk.blue('Authenticating with Nano...'));
    console.log(chalk.green('✓ Successfully authenticated'));
    console.log(chalk.dim('Token saved locally.'));
  });

// Secret Subcommand
const secretCommand = program.command('secret').description('Secret management commands');
secretCommand
  .command('set <key>')
  .description('Set a secret for an environment')
  .option('--env <environment>', 'Environment to set the secret for')
  .option('--value <value>', 'The value of the secret')
  .action(async (key, options) => {
    const value = options.value || await require('@inquirer/prompts').password({ message: `Enter secret value for ${key}:` });
    console.log(chalk.green(`✓ Secret ${key} saved to ${options.env || 'default'} environment`));
  });

secretCommand
  .command('get <key>')
  .description('Get a secret for an environment')
  .option('--env <environment>', 'Environment to get the secret from')
  .action(async (key, options) => {
    console.log(`postgres://user:****@db.nan0.io:5432/app`);
  });

// Run Command
program
  .command('run')
  .description('Inject secrets into your process')
  .option('--env <environment>', 'Environment to pull secrets from')
  .argument('[cmd...]', 'Command to run')
  .allowUnknownOption()
  .action(async (cmdArgs, options, command) => {
    if (!cmdArgs || cmdArgs.length === 0) {
      console.error(chalk.red('Error: No command provided to run.'));
      process.exit(1);
    }
    
    // Inject mock secrets into environment
    const targetEnv = { ...process.env, STRIPE_SECRET_KEY: 'sk_live_12345', DATABASE_URL: 'postgres://user:****@db.nan0.io:5432/app' };
    
    console.log(chalk.dim(`> Injecting secrets for environment: ${options?.env || 'default'}`));
    const { spawn } = require('child_process');
    
    const child = spawn(cmdArgs[0], cmdArgs.slice(1), {
      stdio: 'inherit',
      env: targetEnv,
      shell: true
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
  });

program.parse(process.argv);
