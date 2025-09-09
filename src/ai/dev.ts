import {config} from 'dotenv';
config();

import {dev} from 'genkit/dev';
import {next} from '@genkit-ai/next';

import './flows/suggest-content-changes.ts';

dev({
  plugins: [
    next({
      port: 9002, // your Next.js port
    }),
  ],
});
