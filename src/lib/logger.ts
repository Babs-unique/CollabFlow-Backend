import pino from 'pino';
import pinoHttp from 'pino-http';

const isDev = process.env.NODE_ENV !== 'production';

let logger: pino.Logger;

if (isDev) {
  try {
    const transport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname'
      }
    });

    logger = pino({ level: process.env.LOG_LEVEL || 'debug' }, transport);
  } catch (e) {
    logger = pino({ level: process.env.LOG_LEVEL || 'debug' });
  }
} else {
  logger = pino({ level: process.env.LOG_LEVEL || 'info' });
}

const httpLogger = pinoHttp({ logger });

export default logger;
export { httpLogger };
