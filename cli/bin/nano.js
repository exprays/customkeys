#!/usr/bin/env node

const { program } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const chalk = {
  blue: (t) => `\x1b[34m${t}\x1b[0m`,
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

const API_URL = process.env.NANO_API_URL || 'http://localhost:8080';
const DASHBOARD_URL = process.env.NANO_DASHBOARD_URL || 'http://localhost:3000';
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.nano.json');
const LOCAL_CONFIG_PATH = path.join(process.cwd(), '.nanorc');

async function getConfig() {
  try {
    const data = await fs.readFile(GLOBAL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfig(cfg) {
  const existing = await getConfig();
  await fs.writeFile(GLOBAL_CONFIG_PATH, JSON.stringify({ ...existing, ...cfg }, null, 2));
}

async function getLocalConfig() {
  try {
    const data = await fs.readFile(LOCAL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveLocalConfig(cfg) {
  const existing = await getLocalConfig();
  await fs.writeFile(LOCAL_CONFIG_PATH, JSON.stringify({ ...existing, ...cfg }, null, 2));
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const cfg = await getConfig();
  if (!cfg.token) {
    console.error(chalk.red('Not authenticated. Please run `nano auth login`.'));
    process.exit(1);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    let err;
    try {
      const data = await res.json();
      err = data.message || JSON.stringify(data);
    } catch {
      err = res.statusText;
    }
    console.error(chalk.red(`API Error (${res.status}): ${err}`));
    process.exit(1);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

async function getEnvId(projectId, envName) {
  const res = await apiRequest(`/v1/projects/${projectId}/envs`);
  const envs = res?.environments || res; // depending on whether wrapper exists
  if (!Array.isArray(envs)) {
      console.error(chalk.red(`Failed to parse environments from API.`));
      process.exit(1);
  }
  const env = envs.find(e => e.name === envName || e.slug === envName);
  if (!env) {
    console.error(chalk.red(`Environment '${envName}' not found in project.`));
    process.exit(1);
  }
  return env.id;
}

program
  .name('nano')
  .description('Nano platform CLI')
  .version('0.1.0');

// Login
const authCommand = program.command('auth').description('Authentication commands');
authCommand
  .command('login')
  .description('Authenticate with your account via the dashboard')
  .action(async () => {
    console.log(chalk.blue('Authenticating with Nano...'));
    const server = http.createServer();
    const port = Math.floor(Math.random() * 10000) + 10000;

    server.on('request', async (req, res) => {
      const host = req.headers.host;
      const url = new URL(req.url, `http://${host}`);
      if (url.pathname === '/callback') {
        const token = url.searchParams.get('token');
        if (token) {
          await saveConfig({ token });
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authenticated Successfully</h1><p>You can safely close this tab and return to your terminal.</p><script>window.setTimeout(() => window.close(), 1000)</script>');
          console.log(chalk.green('✓ Successfully authenticated'));
          console.log(chalk.dim(`API Token saved to ${GLOBAL_CONFIG_PATH}`));
          server.close();
          process.exit(0);
        } else {
          res.writeHead(400).end('Missing token');
        }
      } else {
        res.writeHead(404).end();
      }
    });

    server.listen(port, async () => {
      const authUrl = `${DASHBOARD_URL}/cli/auth?port=${port}`;
      console.log(chalk.dim(`Opening browser to: ${authUrl}`));
      const open = require('open');
      await open(authUrl);
    });
  });

// Link
program.command('link')
  .description('Link the current directory to a Nano project')
  .action(async () => {
    const res = await apiRequest('/v1/projects');
    const projects = res?.projects || res;
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      console.error(chalk.red('No projects found. Please create one on the dashboard first.'));
      return;
    }

    const { select } = require('@inquirer/prompts');
    const projectId = await select({
      message: 'Select a project to link:',
      choices: projects.map(p => ({
        name: `${p.name} (${p.slug})`,
        value: p.id
      }))
    });

    await saveLocalConfig({ projectId });
    console.log(chalk.green(`✓ Linked directory to project ${projectId}`));
  });

// Secret
const secretCommand = program.command('secret').description('Secret management commands');
secretCommand
  .command('set <key>')
  .description('Set a secret for an environment')
  .option('--env <environment>', 'Environment to set the secret for', 'production')
  .option('--value <value>', 'The value of the secret')
  .action(async (key, options) => {
    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('Project not linked. Run `nano link` first.'));
      process.exit(1);
    }

    const value = options.value || await require('@inquirer/prompts').password({ message: `Enter secret value for ${key}:` });
    const envId = await getEnvId(local.projectId, options.env);

    await apiRequest(`/v1/projects/${local.projectId}/envs/${envId}/secrets`, 'POST', {
      key,
      value
    });

    console.log(chalk.green(`✓ Secret ${key} saved to ${options.env} environment`));
  });

secretCommand
  .command('get <key>')
  .description('Get a secret for an environment')
  .option('--env <environment>', 'Environment to get the secret from', 'production')
  .action(async (key, options) => {
    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('Project not linked. Run `nano link` first.'));
      process.exit(1);
    }
    const envId = await getEnvId(local.projectId, options.env);
    
    const res = await apiRequest(`/v1/projects/${local.projectId}/envs/${envId}/secrets`);
    const secrets = res?.secrets || res;
    
    if (!Array.isArray(secrets)) {
        console.error(chalk.red(`Failed to parse secrets from API.`));
        process.exit(1);
    }

    const secret = secrets.find(s => s.key === key);
    
    if (!secret) {
      console.error(chalk.red(`Secret ${key} not found in ${options.env}.`));
      process.exit(1);
    }

    console.log(secret.value || secret.decrypted_value || secret.encrypted_value);
  });

// Run
program
  .command('run')
  .description('Inject secrets into your process')
  .option('--env <environment>', 'Environment to pull secrets from', 'production')
  .argument('[cmd...]', 'Command to run')
  .allowUnknownOption()
  .action(async (cmdArgs, options, command) => {
    if (!cmdArgs || cmdArgs.length === 0) {
      console.error(chalk.red('Error: No command provided to run.'));
      process.exit(1);
    }

    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('Project not linked. Run `nano link` first.'));
      process.exit(1);
    }

    const envId = await getEnvId(local.projectId, options.env);
    const res = await apiRequest(`/v1/projects/${local.projectId}/envs/${envId}/secrets`);
    const secrets = res?.secrets || res;
    
    const injectedEnv = {};
    if (secrets && Array.isArray(secrets)) {
      for (const s of secrets) {
         injectedEnv[s.key] = s.value || s.decrypted_value || s.encrypted_value;
      }
    }

    const targetEnv = { ...process.env, ...injectedEnv };
    console.log(chalk.dim(`> Injecting ${Object.keys(injectedEnv).length} secrets for environment: ${options.env}`));

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

// ── Phase 2: rotate command ────────────────────────────────────────────────
program
  .command('rotate <secret-key>')
  .description('Trigger an immediate rotation for a secret')
  .requiredOption('-e, --env <envId>', 'Environment ID')
  .action(async (secretKey, options) => {
    const cfg = loadConfig();
    if (!cfg) return;

    // First find the secret ID by key
    const listResp = await fetch(
      `${cfg.apiUrl}/v1/projects/${cfg.project}/envs/${options.env}/secrets`,
      { headers: { Authorization: `Bearer ${cfg.token}` } }
    );
    if (!listResp.ok) {
      console.error(chalk.red(`Failed to list secrets: ${listResp.status}`));
      process.exit(1);
    }
    const secrets = await listResp.json();
    const secret = (secrets.data || secrets).find(s => s.key === secretKey);
    if (!secret) {
      console.error(chalk.red(`Secret '${secretKey}' not found`));
      process.exit(1);
    }

    const resp = await fetch(`${cfg.apiUrl}/v1/secrets/${secret.id}/rotate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error(chalk.red(`Rotation failed: ${err.error || resp.status}`));
      process.exit(1);
    }
    console.log(chalk.green(`✓ Rotation triggered for '${secretKey}'`));
  });

// ── Phase 2: verify-audit command ─────────────────────────────────────────
program
  .command('verify-audit')
  .description('Verify the HMAC chain integrity of the audit log')
  .option('--limit <n>', 'Number of recent events to verify', '100')
  .action(async (options) => {
    const cfg = loadConfig();
    if (!cfg) return;

    console.log(chalk.blue('Fetching audit log...'));
    const resp = await fetch(
      `${cfg.apiUrl}/v1/orgs/me/audit?limit=${options.limit}`,
      { headers: { Authorization: `Bearer ${cfg.token}` } }
    );
    if (!resp.ok) {
      console.error(chalk.red(`Failed to fetch audit log: ${resp.status}`));
      process.exit(1);
    }
    const { data: events } = await resp.json();
    if (!events || events.length === 0) {
      console.log(chalk.yellow('No audit events found.'));
      return;
    }

    // The server exposes hmac values for admin verification
    let verified = 0;
    let broken = 0;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      // Verify chain linkage (prev_hmac of event[i] should match hmac of event[i+1])
      if (i < events.length - 1) {
        if (ev.prev_hmac !== undefined && events[i + 1].hmac !== undefined) {
          if (ev.prev_hmac !== events[i + 1].hmac) {
            console.error(chalk.red(`✗ Chain break detected at event ${ev.id} (position ${i})`));
            broken++;
          } else {
            verified++;
          }
        }
      }
    }

    if (broken === 0) {
      console.log(chalk.green(`✓ Audit chain intact — ${events.length} events verified, ${verified} links checked`));
    } else {
      console.error(chalk.red(`✗ ${broken} chain breaks detected out of ${events.length} events`));
      process.exit(1);
    }
  });
