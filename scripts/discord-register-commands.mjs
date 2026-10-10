#!/usr/bin/env node
/**
 * Register the /task slash command for the lab's Discord server and point the
 * bot's Interactions Endpoint at the website. Idempotent; re-run after edits.
 *
 *   set -a; . ./.env.local; set +a; node scripts/discord-register-commands.mjs [--endpoint]
 *
 * --endpoint also sets the application's Interactions Endpoint URL to
 * <NEXT_PUBLIC_BASE_URL>/api/discord/interactions (Discord pings it to verify,
 * so the site must already be deployed with DISCORD_PUBLIC_KEY set).
 */
const token = process.env.DISCORD_BOT_TOKEN;
const guild = process.env.DISCORD_GUILD_ID;
const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
if (!token || !guild) throw new Error('DISCORD_BOT_TOKEN and DISCORD_GUILD_ID are required');

const api = async (path, init = {}) => {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${JSON.stringify(body)}`);
  return body;
};

const ZONES = ['General', 'Woodshop', '3D Printing', 'Electronics', 'Laser Cutting', 'CNC', 'Vinyl', 'Metal Shop', 'Waterjet', 'CNC Plasma', 'Mill', 'Lathe', 'Admin'];
const STRING = 3, INTEGER = 4, BOOLEAN = 5, USER = 6, SUB = 1;
const taskOption = { type: STRING, name: 'task', description: 'Start typing a task name or number', required: true, autocomplete: true };

const command = {
  name: 'task',
  description: 'Lab tasks: create, list, search, claim or close',
  contexts: [0], // guild only
  options: [
    {
      type: SUB, name: 'create', description: 'Post a new task to the board',
      options: [
        { type: STRING, name: 'title', description: 'What needs doing?', required: true, min_length: 3, max_length: 120 },
        { type: STRING, name: 'zone', description: 'Where in the lab', required: true, choices: ZONES.map((z) => ({ name: z, value: z })) },
        { type: INTEGER, name: 'minutes', description: 'About how long (default 30)', min_value: 5, max_value: 1440 },
        { type: STRING, name: 'details', description: 'Anything helpful: where things are, what done looks like', max_length: 1000 },
      ],
    },
    { type: SUB, name: 'list', description: 'Your tasks and the newest open ones (only you see this)' },
    {
      type: SUB, name: 'search', description: 'Find tasks by keyword, zone or person (only you see this)',
      options: [
        { type: STRING, name: 'keyword', description: 'Words in the title or details', max_length: 80 },
        { type: STRING, name: 'zone', description: 'Area of the lab', choices: ZONES.map((z) => ({ name: z, value: z })) },
        { type: USER, name: 'user', description: 'Tasks this person is on, posted or finished' },
        { type: BOOLEAN, name: 'include_done', description: 'Include finished tasks (default: no)' },
      ],
    },
    { type: SUB, name: 'claim', description: 'Take a task on', options: [taskOption] },
    {
      type: SUB, name: 'close', description: 'Mark a task finished and log your time',
      options: [
        taskOption,
        { type: INTEGER, name: 'minutes', description: 'How long it took (default: the estimate)', min_value: 1, max_value: 1440 },
        { type: STRING, name: 'note', description: 'Optional note for the board', max_length: 500 },
      ],
    },
  ],
};

const app = await api('/applications/@me');
const cmds = await api(`/applications/${app.id}/guilds/${guild}/commands`, { method: 'PUT', body: JSON.stringify([command]) });
console.log(`Registered ${cmds.map((c) => '/' + c.name).join(', ')} for app "${app.name}" (${app.id}) in guild ${guild}`);
console.log(`Public key (DISCORD_PUBLIC_KEY): ${app.verify_key}`);

if (process.argv.includes('--endpoint')) {
  const url = `${base}/api/discord/interactions`;
  await api('/applications/@me', { method: 'PATCH', body: JSON.stringify({ interactions_endpoint_url: url }) });
  console.log(`Interactions endpoint set: ${url}`);
}
