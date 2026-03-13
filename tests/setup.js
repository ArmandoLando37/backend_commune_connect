/**
 * @file setup.js
 * @description setupFiles Jest — exécuté dans chaque worker avant les tests
 * Charge les variables d'environnement depuis .env
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });