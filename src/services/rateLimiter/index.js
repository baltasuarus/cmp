import http from 'http';
import https from 'https';
import request from 'request';

export default (container) => {
  const { L } = container.defaultLogger('RateLimiter Service');
  const axiosMap = {};

  const createNewAxiosInstance = (key, tps) => {
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    const config = { maxRequests: tps, perMilliseconds: 1000 };
    L.debug('Creating new Axios instance', config);

    const originalAxiosInstance = container.axios.create({
      httpAgent,
      httpsAgent,
    });

    originalAxiosInstance.interceptors.request.use((req) => {
      const currentTime = new Date();
      const year = currentTime.getFullYear();
      const month = currentTime.getMonth() + 1;
      const date = currentTime.getDate();
      const hours = currentTime.getHours();
      const minute = `0${currentTime.getMinutes()}`.slice(-2);
      const second = `0${currentTime.getSeconds()}`.slice(-2);
      const milliseconds = `00${currentTime.getMilliseconds()}`.slice(-3);
      const hour = hours > 12 ? hours - 12 : hours;
      const ampm = hours < 12 ? 'AM' : 'PM';

      const timeText = `${month}/${date}/${year} ${hour}:${minute}:${second}.${milliseconds} ${ampm}`;
      L.debug(`API Request Sent (${key}) at ${timeText}`);

      return req;
    });

    originalAxiosInstance.interceptors.response.use((res) => {
      const currentTime = new Date();
      const year = currentTime.getFullYear();
      const month = currentTime.getMonth() + 1;
      const date = currentTime.getDate();
      const hours = currentTime.getHours();
      const minute = `0${currentTime.getMinutes()}`.slice(-2);
      const second = `0${currentTime.getSeconds()}`.slice(-2);
      const milliseconds = `00${currentTime.getMilliseconds()}`.slice(-3);
      const hour = hours > 12 ? hours - 12 : hours;
      const ampm = hours < 12 ? 'AM' : 'PM';

      const timeText = `${month}/${date}/${year} ${hour}:${minute}:${second}.${milliseconds} ${ampm}`;
      L.debug(`API Response Received (${key}) at ${timeText}`);

      if (res.status >= 400) {
        L.error(`Interceptor (${key}): ${res.status}`, res.data);
      } else {
        L.debug(`Interceptor (${key}): ${res.status}`, res.data);
      }
      return res;
    });

    const rateLimitedAxiosInstance = container.rateLimit(originalAxiosInstance, config);
    return rateLimitedAxiosInstance;
  };

  const createNewBottleneckRequestInstance = (key, tps) => {
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    const config = { maxRequests: tps, perMilliseconds: 1000 };
    L.debug('Creating new Bottleneck instance (Request)', config);

    const minTime = Math.ceil(1000 / tps);
    const bottleneckInstance = new container.Bottleneck({ minTime, trackDoneStatus: true });
    return {
      get: () => bottleneckInstance.schedule(
        () => Promise.resolve(),
      ),
      post: (url, body, requestConfig) => bottleneckInstance.schedule(
        () => new Promise((resolve, reject) => {
          const agent = url.indexOf('https') === 0 ? httpsAgent : httpAgent;
          const { headers = {} } = (requestConfig || {}).headers || {};
          const options = {
            url,
            agent,
            json: body,
            headers,
          };

          const handler = (error, res, resBody) => {
            const counts = bottleneckInstance.counts();
            L.debug('Bottleneck Counts', counts);
            if (error) {
              reject(error);
              return;
            }

            L.error(resBody);
            const newRes = res;
            newRes.data = resBody;
            resolve(newRes);
          };

          request.post(options, handler);
        }),
      ),
      put: () => bottleneckInstance.schedule(
        () => Promise.resolve(),
      ),
      delete: () => bottleneckInstance.schedule(
        () => Promise.resolve(),
      ),
    };
  };

  const createNewBottleneckAxiosInstance = (key, tps) => {
    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    const config = { maxRequests: tps, perMilliseconds: 1000 };
    L.debug('Creating new Bottleneck instance (Axios)', config);

    const minTime = Math.ceil(1000 / tps);
    const bottleneckInstance = new container.Bottleneck({ minTime, trackDoneStatus: true });

    const originalAxiosInstance = container.axios.create({
      httpAgent,
      httpsAgent,
    });

    originalAxiosInstance.interceptors.request.use((req) => {
      const currentTime = new Date();
      const year = currentTime.getFullYear();
      const month = currentTime.getMonth() + 1;
      const date = currentTime.getDate();
      const hours = currentTime.getHours();
      const minute = `0${currentTime.getMinutes()}`.slice(-2);
      const second = `0${currentTime.getSeconds()}`.slice(-2);
      const milliseconds = `00${currentTime.getMilliseconds()}`.slice(-3);
      const hour = hours > 12 ? hours - 12 : hours;
      const ampm = hours < 12 ? 'AM' : 'PM';

      const timeText = `${month}/${date}/${year} ${hour}:${minute}:${second}.${milliseconds} ${ampm}`;
      L.debug(`Bottleneck API Request Sent (${key}) at ${timeText}`);

      const counts = bottleneckInstance.counts();
      L.debug('Bottleneck Counts', counts);

      return req;
    });

    originalAxiosInstance.interceptors.response.use((res) => {
      const currentTime = new Date();
      const year = currentTime.getFullYear();
      const month = currentTime.getMonth() + 1;
      const date = currentTime.getDate();
      const hours = currentTime.getHours();
      const minute = `0${currentTime.getMinutes()}`.slice(-2);
      const second = `0${currentTime.getSeconds()}`.slice(-2);
      const milliseconds = `00${currentTime.getMilliseconds()}`.slice(-3);
      const hour = hours > 12 ? hours - 12 : hours;
      const ampm = hours < 12 ? 'AM' : 'PM';

      const timeText = `${month}/${date}/${year} ${hour}:${minute}:${second}.${milliseconds} ${ampm}`;
      L.debug(`Bottleneck API Response Received (${key}) at ${timeText}`);

      if (res.status >= 400) {
        L.error(`Interceptor (${key}): ${res.status}`, res.data);
      } else {
        L.debug(`Interceptor (${key}): ${res.status}`, res.data);
      }
      return res;
    });

    // limiter.schedule(() => myFunction(arg1, arg2))
    //   .then((result) => {
    //     /* handle result */
    //   });

    return {
      get: (url, requestConfig) => bottleneckInstance.schedule(
        () => originalAxiosInstance.get(url, requestConfig),
      ),
      post: (url, body, requestConfig) => bottleneckInstance.schedule(
        () => originalAxiosInstance.post(url, body, requestConfig),
      ),
      put: (url, body, requestConfig) => bottleneckInstance.schedule(
        () => originalAxiosInstance.put(url, body, requestConfig),
      ),
      delete: (url, body, requestConfig) => bottleneckInstance.schedule(
        () => originalAxiosInstance.delete(url, body, requestConfig),
      ),
    };

    // return {
    //   get: bottleneckInstance.wrap(originalAxiosInstance.get),
    //   post: bottleneckInstance.wrap(originalAxiosInstance.post),
    //   put: bottleneckInstance.wrap(originalAxiosInstance.put),
    //   delete: bottleneckInstance.wrap(originalAxiosInstance.delete),
    // };
  };

  const getAxiosRateLimiter = (id, channel, tps) => {
    const key = `${channel}-${id}`;
    if (axiosMap[key] == null) {
      axiosMap[key] = createNewAxiosInstance(key, tps);
    }

    return axiosMap[key];
  };

  const getAxiosBottleneckAxios = (id, channel, tps) => {
    const key = `${channel}-${id}`;
    if (axiosMap[key] == null) {
      axiosMap[key] = createNewBottleneckAxiosInstance(key, tps);
    }

    return axiosMap[key];
  };

  const getAxiosBottleneckRequest = (id, channel, tps) => {
    const key = `${channel}-${id}`;
    if (axiosMap[key] == null) {
      axiosMap[key] = createNewBottleneckRequestInstance(key, tps);
    }

    return axiosMap[key];
  };

  const getAxios = (id, channel, tps) => {
    const { rateLimiter } = container.config.blaster;
    if (rateLimiter === 'bottleneck') {
      return getAxiosBottleneckAxios(id, channel, tps);
    }

    if (rateLimiter === 'bottleneckaxios') {
      return getAxiosBottleneckAxios(id, channel, tps);
    }

    if (rateLimiter === 'bottleneckrequest') {
      return getAxiosBottleneckRequest(id, channel, tps);
    }

    if (rateLimiter === 'axiosratelimiter') {
      return getAxiosRateLimiter(id, channel, tps);
    }

    L.debug(`Invalid Rate Limiter '${rateLimiter}', using bottleneck`);
    return getAxiosBottleneckAxios(id, channel, tps);
  };

  return {
    getAxios,
  };
};
