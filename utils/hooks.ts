import { AxiosError } from 'axios';
import type { NuxtOptionsHooks } from '@nuxt/types/config/hooks';
import type { NextFunction, Request, Response } from 'express';
import AxiosFormatter from './AxiosFormatter';

export default {
  render: {
    errorMiddleware(app) {
      // @ts-ignore - This is right, but TS seems to not understand ErrorHandler from Express
      app.use((error: any, req: Request, _res: Response, next: NextFunction) => {
        if (!error) {
          return next(error);
        }

        let formatted: any = {};
        const logger = console;

        if (error?.stack) {
          if (error.isAxiosError) {
            formatted.requestError = AxiosFormatter.toErrorJSON(error as AxiosError);
          }

          formatted.message = error.message;
          formatted.stack = error.stack;
        } else {
          formatted = error;
        }

        logger.error(`[nuxtErrorMiddlewareHook] ${req.method} ${req.path}`, {
          method: req.method,
          path: req.path,
          query: req.query,
          error: formatted,
        });
        next(error);
      });
    },
  },
} as NuxtOptionsHooks;
