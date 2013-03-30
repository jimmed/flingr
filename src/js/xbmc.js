/**
 * XBMC Websockets client
 * @author Jim O'Brien
 */

window.xbmc = (function(xbmc, $, _, undefined) {

	var XBMC = function(options) {
		_.extend(this, options);
		this.jsonrpc = jsonrpc(this.host, this.port);
		this.events = {};
		this.subscribeEvents.call(this);
		return this;
	};

	XBMC.prototype.disconnect = function() {
		var promise = $.Deferred();
		console.log('Disconnecting...');
		this.jsonrpc.close(function() {
			promise.resolve();
		});
		return promise.promise();
	};

	/* Wraps a jQuery.Deferred promise around JSONRPC send */
	XBMC.prototype.send = function(method, params) {
		var promise = $.Deferred();
		this.jsonrpc.send({
			method: method,
			params: params || {}
		}, function(response) {
			promise.resolve(response);
		}, function(error) {
			promise.reject(error);
		});
		return promise.promise();
	};

	XBMC.prototype.introspect = _.once(function() {
		var host = this,
			promise = $.Deferred();
		console.log('Waiting for API introspection...');

		this.send('JSONRPC.Introspect').done(function(tree) {
			var API = {};
			_.each(tree.methods, function(method, name) { 
				var namePath = name.split(/\./g, 2),
					sectionName = namePath[0],
					methodName = namePath[1],
					section = (API[sectionName] = API[sectionName] || {});

				section[methodName] = method;
				method.send = function(params, ttl) {
					var promise = $.Deferred(),
						errors = [];
					params = params || {};
					if(method.params) {
						var requiredParams = _.where(method.params, {required: true});
						_.each(requiredParams, function(value) {
							if(!_.has(params, value.name)) {
								errors.push('Required parameter ' + value.name);
							}
						});
					}
					if(!errors.length) {
						console.info('>>', name, params);
						host.trigger('XBMC.Request', {method: name, params: params});
						host.send(name, params, ttl).done(function(result) {
							console.info('<<', name, result);
							host.trigger('XBMC.Response', {method: name, result: result});
							promise.resolve(result);
						}).fail(function(error) {
							console.warn('<<', error.data.method, error.data.stack);
							promise.reject(error);
						});
					} else {
						console.error(errors);
						promise.reject(errors);
					}
					return promise.promise();
				};
			});
			host.api = API;
			host.introspection = tree;
			promise.resolve(host);
		}).fail(function(error) {
			promise.reject(error);
		});
		return promise.promise();
	});

	XBMC.prototype.subscribeEvents = function(events) {
		var _this = this;
		this.jsonrpc.on('JSONRPC.Event', function(data) {
			_this.trigger(data.method, data.params || {});
			_this.trigger('XBMC.Event', data || {});
		});
	};

	XBMC.prototype.trigger = function(event, params) {
		if(_.isArray(this.events[event])) {
			_.each(this.events[event], function(ev) {
				ev(params, event);
			});
		}
		return this;
	};

	XBMC.prototype.on = function(event, callback) {
		if(_.isFunction(callback)) {
			if(_.isArray(this.events[event])) {
				this.events[event].push(callback);
			} else {
				this.events[event] = [callback];
			}
		}
		return this;
	};

	XBMC.prototype.off = function(event, callback) {
		if(event) {
			if(_.isFunction(callback)) {
				this.events[event] = _.reject(this.events[event], function(maybe) {
					return callback === maybe;
				})
			} else {
				this.events[event] = [];
			}
		} else {
		}
		return this;
	};

	xbmc.createHost = function(hostOptions) {
		var promise = $.Deferred(),
			host = new XBMC(hostOptions);

		if(host && host.on) {
			host.jsonrpc
				.on('JSONRPC.Connected', function() {
					console.log('CONNECTED!');
					host.introspect().done(function() {
						console.log('Introspection complete');
						promise.resolve(host);
					}).fail(function() {
						promise.reject();
					});
				})
				.on('JSONRPC.SocketError', function(error) {
					console.error('Connection failed', error);
					promise.reject(error)
				})
				.on('JSONRPC.Disconnect', function(error) {
					console.error('Socket closed', error);
					promise.reject(error);
				});
		} else {
			promise.reject();
		}
		return promise.promise();
	};

	/**
	 * Utility wrappers for XBMC API
	 */

	return xbmc;

}).call(this, window.xbmc || {}, jQuery, _);