import { execSync } from 'child_process';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

function reset(): void {
  logger.debug('Removing existing filestore dir');
  execSync('docker exec -it odoo /bin/bash -c "rm -rf /var/lib/odoo/filestore/odoo"', { stdio: 'inherit' });

  const username = 'odoo';
  const password = 'odoo';
  const database = 'odoo';
  const host = 'odoo-db';
  const containerName = 'odoo';

  logger.debug('Dropping database');
  execSync(`docker exec -it ${containerName} /bin/bash -c "PGPASSWORD=${password} psql -d postgres -U ${username} -h ${host} -c \\"DROP DATABASE IF EXISTS ${database} WITH (FORCE)\\""`, { stdio: 'ignore' });

  logger.debug('Initializing Odoo');
  execSync(`docker exec -it ${containerName} /bin/bash -c "odoo --init base --database ${database} --without-demo all --db_host ${host} --db_user ${username} --db_password ${password} --stop-after-init"`, { stdio: 'ignore' });

  logger.info('Reset Odoo');
}

if (require.main === module) {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
  reset();
}