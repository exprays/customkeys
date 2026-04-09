#!/usr/bin/env node

const { program } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ── NEON VOLT TERMINAL DESIGN SYSTEM ──
const chalk = {
  volt: (t) => `\x1b[38;2;250;255;105m${t}\x1b[0m`,
  voltBg: (t) => `\x1b[48;2;250;255;105m\x1b[30m\x1b[1m${t}\x1b[0m`,
  red: (t) => `\x1b[38;2;239;68;68m${t}\x1b[0m`,
  redBg: (t) => `\x1b[48;2;239;68;68m\x1b[37m\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
  white: (t) => `\x1b[37m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

const API_URL = process.env.CUSTOMKEYS_API_URL || 'http://localhost:8080';
const DASHBOARD_URL = process.env.CUSTOMKEYS_DASHBOARD_URL || 'http://localhost:3000';
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.customkeys.json');
const LOCAL_CONFIG_PATH = path.join(process.cwd(), '.customkeysrc');

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
    console.error(chalk.red('[ ERR ]') + ' Authentication required. Run `customkeys auth login`.');
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
    console.error(chalk.red('[ ERR ]') + ` Protocol violation (${res.status}): ${err}`);
    process.exit(1);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

async function getEnvId(projectId, envName) {
  const res = await apiRequest(`/v1/projects/${projectId}/envs`);
  const envs = res?.environments || res; 
  if (!Array.isArray(envs)) {
      console.error(chalk.red('[ ERR ]') + ' Workspace state parsing failed.');
      process.exit(1);
  }
  const env = envs.find(e => e.name === envName || e.slug === envName);
  if (!env) {
    console.error(chalk.red('[ ERR ]') + ` Environment '${envName}' not located in bounded project.`);
    process.exit(1);
  }
  return env.id;
}

program
  .name('customkeys')
  .description('CustomKeys Zero-Trust Platform CLI')
  .version('1.0.0');

// Login
const authCommand = program.command('auth').description('Authentication subroutines');
authCommand
  .command('login')
  .description('Authenticate device with cluster via SSO')
  .action(async () => {
    console.log(chalk.voltBg(' AUTH ') + chalk.bold(' Initializing secure handshake...'));
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
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Authentication Complete</title>
                <style>
                  body {
                    margin: 0; padding: 0;
                    background-color: #000000;
                    color: #ffffff;
                    height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                  }
                  .box {
                    max-width: 480px; width: 100%;
                    background-color: #0a0a0a;
                    border: 1px solid #1a1a1a;
                    border-radius: 4px;
                    overflow: hidden;
                    text-align: left;
                  }
                  .header {
                    background-color: #000000;
                    padding: 24px 32px;
                    border-bottom: 2px solid #faff69;
                    display: flex; align-items: center;
                  }
                  .logo-box {
                    display: inline-block;
                    width: 32px; height: 32px;
                    background-color: #faff69; color: #000000;
                    font-weight: 900; font-size: 16px; line-height: 32px; text-align: center;
                    border-radius: 2px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                  }
                  .brand-text {
                    color: #ffffff; font-weight: 900; font-size: 20px;
                    text-transform: uppercase; letter-spacing: -0.05em; margin-left: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                  }
                  .content {
                    padding: 40px 32px;
                    position: relative;
                  }
                  h1 {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                    font-size: 24px; font-weight: 900; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: -0.02em;
                  }
                  p {
                    font-size: 14px; line-height: 1.6; color: #888888; margin: 0;
                  }
                  .terminal {
                    background-color: #000000;
                    border: 1px solid #1a1a1a; padding: 16px; border-radius: 2px;
                    margin-top: 24px; color: #faff69; font-size: 12px; font-weight: bold;
                  }
                </style>
              </head>
              <body>
                <div class="box">
                  <div class="header">
                    <div class="logo-box">ck</div>
                    <div class="brand-text">CUSTOMKEYS</div>
                  </div>
                  <div class="content">
                    <h1>Identity Verified</h1>
                    <p>Cryptographic handshake complete. Your CLI session is now actively tethered to your workspace.</p>
                    <div class="terminal">
                      > Connection established.<br>
                      > You may safely close this transmission.
                    </div>
                  </div>
                </div>
                <script>window.setTimeout(() => window.close(), 3000)</script>
              </body>
            </html>
          `);
          console.log(chalk.volt('[ OK ]') + ' Cryptographic identity established');
          console.log(chalk.dim(`[ SYS ] Root token persisted to ${GLOBAL_CONFIG_PATH}`));
          server.close();
          process.exit(0);
        } else {
          res.writeHead(400).end('ERR: Missing Token');
        }
      } else {
        res.writeHead(404).end();
      }
    });

    server.listen(port, async () => {
      const authUrl = `${DASHBOARD_URL}/cli/auth?port=${port}`;
      console.log(chalk.dim(`[ SYS ] Browser launch vector: ${authUrl}`));
      try {
        const openPkg = await import('open');
        const openCmd = openPkg.default || openPkg;
        await openCmd(authUrl);
      } catch (err) {
        console.log(chalk.dim(`[ SYS ] Intercept trigger failed. Manual execution required: ${authUrl}`));
      }
    });
  });

// Link
program.command('link')
  .description('Synchronize current directory to a remote project boundary')
  .action(async () => {
    const res = await apiRequest('/v1/projects');
    const projects = res?.projects || res;
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      console.error(chalk.red('[ ERR ]') + ' Zero active projects identified. Please instantiate on the dashboard.');
      return;
    }

    const { select } = require('@inquirer/prompts');
    const projectId = await select({
      message: chalk.volt('Select project space to tether:'),
      choices: projects.map(p => ({
        name: chalk.bold(p.name) + chalk.dim(` (${p.slug})`),
        value: p.id
      }))
    });

    await saveLocalConfig({ projectId });
    console.log(chalk.volt('[ OK ]') + ` Directory tethered to cluster bound ${projectId}`);
  });

// Secret
const secretCommand = program.command('secret').description('Vault management directives');
secretCommand
  .command('set <key>')
  .description('Cipher a secret into a specific environment')
  .option('--env <environment>', 'Target environment', 'production')
  .option('--value <value>', 'Raw payload value')
  .action(async (key, options) => {
    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('[ ERR ]') + ' Terminal detached. Trigger `customkeys link` first.');
      process.exit(1);
    }

    const value = options.value || await require('@inquirer/prompts').password({ message: chalk.volt(`Input cipher value for [${key}]:`) });
    const envId = await getEnvId(local.projectId, options.env);

    await apiRequest(`/v1/projects/${local.projectId}/envs/${envId}/secrets`, 'POST', {
      key,
      value
    });

    console.log(chalk.volt('[ OK ]') + ` Payload ${chalk.bold(key)} encrypted into [${options.env}] boundary`);
  });

secretCommand
  .command('get <key>')
  .description('Decrypt a secret payload from an environment')
  .option('--env <environment>', 'Target environment', 'production')
  .action(async (key, options) => {
    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('[ ERR ]') + ' Terminal detached. Trigger `customkeys link` first.');
      process.exit(1);
    }
    const envId = await getEnvId(local.projectId, options.env);
    
    const res = await apiRequest(`/v1/projects/${local.projectId}/envs/${envId}/secrets`);
    const secrets = res?.secrets || res;
    
    if (!Array.isArray(secrets)) {
        console.error(chalk.red('[ ERR ]') + ' Malformed decryption protocol.');
        process.exit(1);
    }

    const secret = secrets.find(s => s.key === key);
    
    if (!secret) {
      console.error(chalk.red('[ ERR ]') + ` Parameter [${key}] absent in [${options.env}] boundary.`);
      process.exit(1);
    }

    console.log(secret.value || secret.decrypted_value || secret.encrypted_value);
  });

// Run
program
  .command('run')
  .description('Inject decrypted variables directly into a process execution shell')
  .option('--env <environment>', 'Target injection environment', 'production')
  .argument('[cmd...]', 'Target execution command')
  .allowUnknownOption()
  .action(async (cmdArgs, options, command) => {
    if (!cmdArgs || cmdArgs.length === 0) {
      console.error(chalk.red('[ ERR ]') + ' Fatal: Empty execution vector.');
      process.exit(1);
    }

    const local = await getLocalConfig();
    if (!local.projectId) {
      console.error(chalk.red('[ ERR ]') + ' Terminal detached. Trigger `customkeys link` first.');
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
    console.log(chalk.voltBg(' EXEC ') + chalk.bold(` Overriding process shell with ${Object.keys(injectedEnv).length} parameters from [${options.env}]`));

    const child = spawn(cmdArgs[0], cmdArgs.slice(1), {
      stdio: 'inherit',
      env: targetEnv,
      shell: true
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
  });

// ── Phase 2: rotate command ────────────────────────────────────────────────
program
  .command('rotate <secret-key>')
  .description('Force cryptographic rotation cycle for a targeted secret')
  .requiredOption('-e, --env <envId>', 'Environment ID mapping')
  .action(async (secretKey, options) => {
    const cfg = await getConfig();
    const local = await getLocalConfig();
    if (!cfg.token) {
      console.error(chalk.red('[ ERR ]') + ' Authentication required.');
      process.exit(1);
    }
    if (!local.projectId) {
      console.error(chalk.red('[ ERR ]') + ' Terminal detached.');
      process.exit(1);
    }

    const listResp = await fetch(
      `${API_URL}/v1/projects/${local.projectId}/envs/${options.env}/secrets`,
      { headers: { Authorization: `Bearer ${cfg.token}` } }
    );
    if (!listResp.ok) {
      console.error(chalk.red('[ ERR ]') + ` Cluster fetch failed: ${listResp.status}`);
      process.exit(1);
    }
    const secrets = await listResp.json();
    const secret = (secrets.secrets || secrets.data || secrets).find(s => s.key === secretKey);
    if (!secret) {
      console.error(chalk.red('[ ERR ]') + ` Target coordinate '${secretKey}' not resolved`);
      process.exit(1);
    }

    const resp = await fetch(`${API_URL}/v1/secrets/${secret.id}/rotate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error(chalk.red('[ ERR ]') + ` Rotation locked: ${err.error || resp.status}`);
      process.exit(1);
    }
    console.log(chalk.volt('[ OK ]') + ` Cryptographic sequence triggered for '${secretKey}'`);
  });

// ── Phase 2: verify-audit command ─────────────────────────────────────────
program
  .command('verify-audit')
  .description('Validate HMAC chain integrity of the immutable ledger')
  .option('--limit <n>', 'Vector trace depth', '100')
  .action(async (options) => {
    const cfg = await getConfig();
    if (!cfg.token) {
       console.error(chalk.red('[ ERR ]') + ' Authentication required.');
       process.exit(1);
    }

    console.log(chalk.dim('[ SYS ] Processing cryptographic trace...'));
    const resp = await fetch(
      `${API_URL}/v1/orgs/me/audit?limit=${options.limit}`,
      { headers: { Authorization: `Bearer ${cfg.token}` } }
    );
    if (!resp.ok) {
      console.error(chalk.red('[ ERR ]') + ` Pipeline fetch failed: ${resp.status}`);
      process.exit(1);
    }
    const apiRes = await resp.json();
    const events = apiRes.events || apiRes.data || apiRes;
    if (!events || events.length === 0) {
      console.log(chalk.dim('[ SYS ] Immutable ledger is barren.'));
      return;
    }

    let verified = 0;
    let broken = 0;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (i < events.length - 1) {
        if (ev.prev_hmac !== undefined && events[i + 1].hmac !== undefined) {
          if (ev.prev_hmac !== events[i + 1].hmac) {
            console.error(chalk.redBg(' ALERT ') + ` Chain divergence node id:${ev.id} (pos ${i})`);
            broken++;
          } else {
            verified++;
          }
        }
      }
    }

    if (broken === 0) {
      console.log(chalk.volt('[ OK ]') + ` Ledger integral. ${verified} hashes structurally validated.`);
    } else {
      console.error(chalk.red('[ ERR ]') + ` SECURITY VIOLATION: ${broken} compromised nodes identified.`);
      process.exit(1);
    }
  });

program.parse(process.argv);
