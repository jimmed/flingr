/**
 * Websockets JSONRPC client
 * @author Jim O'Brien
 */

window.flingr = (function(flingr, _, undefined) {

	flingr.jsonrpc = function(host, port) {
		this.rpcversion = "2.0";
		this.lastId = 0;
		this.activeRequests = 0;
		this.maxConcurrentRequests = 1;
		this.queue = [];
		this.websocket = new flingr.websocket(host, port);
		this.events = {};
		this.eventListen();
	};

	flingr.jsonrpc.prototype.trigger = function(event, data) {
		if(_.isArray(this.events[event])) {
			_.each(this.events[event], function(ev) {
				ev(data, event);
			});
		}
		return this;
	};

	flingr.jsonrpc.prototype.eventListen = _.once(function() {
		var _this = this;

		_this.websocket
			.on('data', function(json) {
				var data = _this.deserialize(json),
					eventName,
					errorEventName;

				if(data.id) {
					eventName = 'JSONRPC.Response' + data.id;
					errorEventName = eventName + '.Error';
					if(data.result) {
						_this.trigger(eventName, data.result);
					}
					if(data.error) {
						_this.trigger(errorEventName, data.error);
					}
					_this.events = _.omit(_this.events, [eventName, errorEventName]);
				} else if(data.method) {
					_this.trigger(data.method, data.params || {});
					_this.trigger('JSONRPC.Event', data);
				} else {
					console.info('Undecipherable data was returned from the socket', json, data);
					_this.trigger('JSONRPC.Error', 'Invalid response from API');
				}
			})
			.on('open', function() {
				_this.trigger('JSONRPC.Connected');
			})
			.on('close', function() {
				_this.trigger('JSONRPC.Disconnect', arguments);
			})
			.on('error', function(error) {
				_this.trigger('JSONRPC.SocketError', error);
			});

		return this;
	});

	flingr.jsonrpc.prototype.serialize = function(data) {
		var thisId = ++this.lastId,
			payload = _.extend({
				jsonrpc: this.rpcversion,
				id: thisId
			}, data);

		return {
			id: thisId,
			payload: JSON.stringify(payload)
		}
	};

	flingr.jsonrpc.prototype.deserialize = function(json) {
		var data;
		
		try {
			data = JSON.parse(json);
		} catch(e) {
			throw new Exception('Response could not be parsed as JSON', json, e);
		}

		if(!data || !data.jsonrpc) {
			throw new Exception('Response does not appear to be valid JSONRPC', data);
		}

		if(data.jsonrpc !== '2.0') {
			throw new Exception('Resposne is not JSONRPC v2.0', data);
		}

		if(data.result === undefined && data.method === undefined && data.error === undefined) {
			throw new Exception('JSONRPC response has no result, method or error', data);
		}

		return _.omit(data, 'jsonrpc');
	};

	flingr.jsonrpc.prototype.on = function(event, callback) {
		if(!_.isArray(this.events[event])) {
			this.events[event] = [callback];
		} else {
			this.events[event].push(callback);
		}
		return this;
	};

	flingr.jsonrpc.prototype.send = function(data, successCallback, errorCallback, ttl) {
		var _this = this,
			request = this.serialize(data),
			eventName = 'JSONRPC.Response' + request.id,
			errorEventName = eventName + '.Error',
			timeout,
			done,
			processQueue = function() {
				console.info('API:', _this.activeRequests, 'active requests,', _this.queue.length, 'queued requests');
				if(_this.queue.length && _this.activeRequests < _this.maxConcurrentRequests) {
					var request = _this.queue.pop();
					_this.activeRequests++;
					_this.websocket.send(request);
				}
			};

		if(ttl) {
			timeout = setTimeout(_.partial(errorCallback, 'Timeout exceeded.'), ttl * 1000);
		}

		done = function(callback) {
			return function() {
				if(timeout) clearTimeout(timeout);
				_this.activeRequests--;
				processQueue();
				callback.apply(this, arguments);
			}
		};

		this.on(eventName, done(successCallback))
			.on(errorEventName, done(errorCallback));

		this.queue.unshift(request.payload);
		processQueue();

		return this;
	};

	flingr.jsonrpc.prototype.close = function(callback) {
		this.websocket.on('close', callback).close();
		return this;
	};

	return flingr;

}).call(this, window.flingr || {}, _);