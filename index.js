'use strict';

const BPromise = require('bluebird');

const LambdaInvoker = require('aws-lambda-invoker');

module.exports = class BatchLambdaInvoker {
  constructor(options) {
    options = Object.assign({
      maxConcurrency: 5
    }, options);
    this._logger = options.logger;
    this._options = options;
    this._invoker = new LambdaInvoker(options);
  }

  _invokeWithType(isAsync, options, cb) {
    const logger = this._logger;
    cb = cb || function defaultCB(err, result) {
      return new BPromise((resolve, reject) => {
        if (err) {
          logger && logger.error({ err }, 'error occurred while scheduling lambda invocations');
          err._logged = true;
          reject(err);
          return;
        }
        logger && logger.debug({ result }, 'lambda invocations successfully scheduled');
        resolve(result);
      });
    };

    if (!options.functionName || !options.payloads) {
      return cb(new Error('functionName and payloads are required properties of the options parameter.'));
    }

    // allow option defaults to be set at constructor level and then
    // overridden at individual method call level
    options.options = Object.assign({}, this._options, options.options);

    logger && logger.debug({
      isAsync,
      options
    }, 'trying to batch invoke lambda');

    const invoke = isAsync
      ? this._invoker.invokeAsync.bind(this._invoker)
      : this._invoker.invoke.bind(this._invoker);

    return BPromise.map([].concat(options.payloads), payload => {
      const invokeOptions = {
        functionName: options.functionName,
        payload: payload,
        clientContext: options.clientContext
      };
      logger && logger.debug({
        isAsync,
        invokeOptions
      }, 'scheduling lambda invocation');

      return invoke(invokeOptions);
    }, { concurrency: options.options.maxConcurrency })
    .then( schedulingResult => cb(null, schedulingResult))
    .catch(cb);
  }

  invoke(options, cb) {
    return this._invokeWithType(false, options, cb);
  }

  invokeAsync(options, cb) {
    return this._invokeWithType(true, options, cb);
  }
};
