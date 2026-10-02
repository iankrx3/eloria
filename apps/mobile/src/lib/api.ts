import { createApiClient } from './api-client';
import { env } from './env';

export const api = createApiClient(env.apiUrl);
