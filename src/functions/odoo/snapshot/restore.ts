import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as rimraf from 'rimraf';
import extract from 'extract-zip';
import pino from 'pino';

const logger = pino({ name: 'odoo.restore', level: 'debug' });

const defaultDatabaseUrl = 'postgres://odoo:odoo@localhost:8070/odoo';
const defaultFilestoreDir = path.join(__dirname, 'data', 'filestore', 'odoo');

function restoreFilestore(filestoreDir: string, odooFilestoreDir: string) {
  if (!fs.existsSync(filestoreDir)) {
    throw new Error(`Filestore dir not found: ${filestoreDir}`);
  }
  if (fs.existsSync(odooFilestoreDir)) {
    logger.debug({ odooFilestoreDir }, 'Removing existing filestore dir');
    rimraf.sync(odooFilestoreDir);
  }

  logger.debug({ fromDir: filestoreDir, toDir: odooFilestoreDir }, 'Restoring filestore');
  if (!fs.existsSync(path.dirname(odooFilestoreDir))) {
    fs.mkdirSync(path.dirname(odooFilestoreDir), { recursive: true });
  }
  fs.renameSync(filestoreDir, odooFilestoreDir);
}

function restoreDatabase(dumpPath: string, odooDatabaseUrl: string) {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Dump file not found: ${dumpPath}`);
  }

  // delete and recreate schema public
  logger.debug('Dropping schema public');
  execSync(`psql ${odooDatabaseUrl} -c "DROP SCHEMA IF EXISTS public CASCADE"`, { stdio: 'ignore' });
  execSync(`psql ${odooDatabaseUrl} -c "CREATE SCHEMA public"`, { stdio: 'ignore' });

  logger.debug({ dumpPath }, 'Restoring database');
  execSync(`psql ${odooDatabaseUrl} < ${dumpPath}`, { stdio: 'ignore' });
}

async function restartOdooContainer() {
  logger.info('Restarting Odoo container');
  execSync('docker restart odoo', { stdio: 'ignore' });
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export async function restore(
  name: string,
  snapshotDir: string,
  odooDatabaseUrl: string = defaultDatabaseUrl,
  odooFilestoreDir: string = defaultFilestoreDir,
) {
  const snapshotPath = path.join(snapshotDir, `${name}.zip`);
  logger.info(`Restoring snapshot ${name} from ${snapshotPath}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-'));

  logger.debug({ snapshotPath, tempDir }, 'Extracting snapshot');
  await extract(snapshotPath, { dir: tempDir });

  restoreFilestore(path.join(tempDir, 'filestore'), odooFilestoreDir);
  restoreDatabase(path.join(tempDir, 'dump.sql'), odooDatabaseUrl);
  await restartOdooContainer();
  logger.info(`Restored snapshot ${name}`);
}

// Main
if (require.main === module) {
  logger.level = 'debug';
  const args = process.argv.slice(2);

  const name = args[0];
  const snapshotDir = args[1];
  const databaseUrl = args[2] || defaultDatabaseUrl;

  if (!name) {
    logger.error('Snapshot name is required');
    process.exit(1);
  }
  if (!snapshotDir) {
    logger.error('Snapshot dir is required');
    process.exit(1);
  }

  logger.debug('Starting restoration process');
  restore(name, snapshotDir, databaseUrl);
}
