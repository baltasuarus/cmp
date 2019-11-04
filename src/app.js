import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import container from './container';
import Router from './router';

// Always use Singapore Timezone
process.env.TZ = 'Asia/Singapore';

// Config
const {
  config, log4js, socketIoService, errorHandler,
} = container;
const { host, port, environment } = config;
const { L } = container.defaultLogger('Application');

const app = express();

app.set('trust proxy', true);
app.set('view engine', 'jade');
app.use(helmet());
app.use(cors());


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression({ level: 9 }));

app.use(log4js.connectLogger(L, { level: log4js.levels.INFO }));

app.use('/', Router(container));
app.use(errorHandler.handleError);

const httpServer = http.createServer(app);
socketIoService.init(httpServer);

httpServer.listen(port, () => {
  L.info(`Server (${environment}) running at ${host}:${port}`);
});
