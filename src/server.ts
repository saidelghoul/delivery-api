import './instrument.js';
import 'dotenv/config';
import app from './app.js';
import pino from 'pino';

const PORT = process.env.PORT || 3000;
const logger = pino();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
