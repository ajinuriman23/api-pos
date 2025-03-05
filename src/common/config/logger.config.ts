// logger.config.ts
import * as winston from 'winston';
import { TransformableInfo } from 'logform';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Pastikan direktori logs ada
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Interface untuk memperjelas struktur data
interface LogMetadata {
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    protocol?: string;
    path?: string;
  };
  response?: {
    statusCode?: number;
    headers?: Record<string, string>;
  };
  error?: {
    name?: string;
    message?: string;
    code?: string | number;
    stack?: string;
  };
  custom_data?: any;
}

// Format metadata dengan type safety yang lebih baik
const formatMetadata = (info: TransformableInfo): TransformableInfo => {
  const { ...rest } = info;
  const metadata = rest as unknown as LogMetadata;

  // Kita harus mengembalikan TransformableInfo, bukan Record<string, any>
  return {
    ...info, // Mempertahankan semua properti asli
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    formattedMetadata: {
      request: metadata.request
        ? {
            method: metadata.request.method,
            url: metadata.request.url,
            headers: {
              'user-agent': metadata.request.headers?.['user-agent'],
              'cf-ray': metadata.request.headers?.['cf-ray'],
              'cf-connecting-ip':
                metadata.request.headers?.['cf-connecting-ip'],
              'content-type': metadata.request.headers?.['content-type'],
              host: metadata.request.headers?.host,
            },
            protocol: metadata.request.protocol,
            path: metadata.request.path,
          }
        : null,
      response: metadata.response
        ? {
            status_code: metadata.response.statusCode,
            headers: {
              'content-type': metadata.response.headers?.['content-type'],
              'x-sb-error-code': metadata.response.headers?.['x-sb-error-code'],
            },
          }
        : null,
      error: metadata.error
        ? {
            name: metadata.error.name,
            message: metadata.error.message,
            code: metadata.error.code,
            stack: metadata.error.stack,
          }
        : null,

      custom_data: metadata.custom_data || null,
    },
  };
};

// Konfigurasi winston logger yang lebih terstruktur
export const WinstonLoggerConfig = {
  // Format dasar yang digunakan untuk semua transport
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format((info) => formatMetadata(info))()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const { timestamp, level, message, context, stack } = info;
          const contextStr = context ? `[${JSON.stringify(context)}] ` : '';
          const stackStr = stack ? `\n${JSON.stringify(stack)}` : '';
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          return `${timestamp} ${level} ${contextStr}${message}${stackStr}`;
        })
      ),
    }),

    // Error file transport
    new winston.transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
      format: winston.format.json(),
      handleExceptions: true,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 14,
    }),

    // Combined file transport
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.json(),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 7,
    }),

    // Rotating file transport (uncomment jika diperlukan)
    /*
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.json(),
    })
    */
  ],
  // Penanganan exception khusus
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  // Penanganan promise rejection khusus
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  // Mencegah proses keluar setelah exception (baik untuk aplikasi produksi)
  exitOnError: false,
};
