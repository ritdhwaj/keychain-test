import log4js from 'log4js';
import { config } from './config';

const logLevel = config.logLevel || 'info';

log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: {
      type: 'file',
      filename: 'logs/execution.log',
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
    },
  },
  categories: {
    default: { appenders: ['out', 'app'], level: logLevel },
  },
});

export const logger = log4js.getLogger('playwright');
