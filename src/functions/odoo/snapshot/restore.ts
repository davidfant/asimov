import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as unzipper from 'unzipper';
import * as rimraf from 'rimraf';
import pino from 'pino';

const logger = pino({ name: 'odoo.restore' });

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
  copyDir(filestoreDir, odooFilestoreDir);
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

function restartOdooContainer() {
  logger.info('Restarting Odoo container');
  execSync('docker restart odoo', { stdio: 'ignore' });
}

function restore(name: string, snapshotDir: string, odooDatabaseUrl: string = defaultDatabaseUrl, odooFilestoreDir: string = defaultFilestoreDir) {
  const snapshotPath = path.join(snapshotDir, `${name}.zip`);
  logger.info(`Restoring snapshot ${name} from ${snapshotPath}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-'));

  logger.debug({ snapshotPath, tempDir }, 'Extracting snapshot');
  fs.createReadStream(snapshotPath)
    .pipe(unzipper.Extract({ path: tempDir }))
    .on('close', () => {
      restoreFilestore(path.join(tempDir, 'filestore'), odooFilestoreDir);
      restoreDatabase(path.join(tempDir, 'dump.sql'), odooDatabaseUrl);
      restartOdooContainer();
      logger.info(`Restored snapshot ${name}`);
    });
}

function copyDir(src: string, dest: string) {
  fs.readdirSync(src, { withFileTypes: true }).forEach((dirent) => {
    const srcPath = path.join(src, dirent.name);
    const destPath = path.join(dest, dirent.name);

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    dirent.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  });
}

// Main
if (require.main === module) {
  logger.level = 'debug';
  const args = process.argv.slice(2);

  console.log('dang...', process.argv);

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
