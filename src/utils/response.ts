import { Context } from 'hono';
import { BankingError } from '../errors/BankingError';

type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

const serializeDate = (date: Date): string => date.toISOString();

const serializeData = (data: any): JSONValue => {
  if (data === null || data === undefined) {
    return null;
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (data instanceof Date) {
    return serializeDate(data);
  }

  if (typeof data === 'object') {
    const result: { [key: string]: JSONValue } = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeData(value);
    }
    return result;
  }

  return data;
};

export const errorResponse = (c: Context, error: unknown) => {
  if (error instanceof BankingError) {
    return c.json({ 
      success: false,
      error: { 
        code: error.code, 
        message: error.message,
        entity: error.entity,
        details: error.details
      }
    }, error.code === 'VALIDATION_ERROR' ? 400 : 
       error.code === 'UNAUTHORIZED' ? 401 :
       error.code === 'FORBIDDEN' ? 403 :
       error.code === 'NOT_FOUND' ? 404 : 500 as StatusCode);
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return c.json({ 
    success: false,
    error: { 
      code: 'INTERNAL_ERROR',
      message,
      entity: 'SYSTEM'
    }
  }, 500 as StatusCode);
};

export const successResponse = (c: Context, data: unknown, status: StatusCode = 200) => {
  return c.json({
    success: true,
    data: serializeData(data)
  }, status);
};
