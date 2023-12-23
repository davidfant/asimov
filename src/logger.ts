import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    // winston.format.timestamp(),
    winston.format.label(),
    winston.format.simple(),
  ),
  transports: [new winston.transports.Console()],
});

export const createLogger = (label: string) => logger.child({ label });
