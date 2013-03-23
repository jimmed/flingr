/**
 * XBMC Websockets client
 * @author Jim O'Brien
 */

window.xbmc = (function(xbmc, $, undefined) {

	var XBMC = function(options) {
		_.extend(this, options);
		this.jsonrpc = jsonrpc(this.host, this.port);
		this.events = {};
		this.subscribeEvents.call(this);
		return this;
	};

	/* Wraps a jQuery.Deferred promise around JSONRPC send */
	XBMC.prototype.api = function(method, params) {
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

	XBMC.prototype.introspect = function() {
		return this.api('JSONRPC.Introspect');
	};

	XBMC.prototype.subscribeEvents = function(events) {
		var _this = this;
		this.jsonrpc.on('JSONRPC.Event', function(data) {
			_this.trigger(data.method, data.params || {});
			_this.trigger('XBMC.Event', data || {});
		});
	};

	XBMC.prototype.trigger = function(event, params) {
		console.log('XBMC Event', event, params);
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
			host.jsonrpc.on('JSONRPC.Connected', function() {
				console.log('CONNECTED!');
				promise.resolve(host);
			});
			host.jsonrpc.on('JSONRPC.SocketError', function(error) {
				console.error('Connection failed', error);
				promise.reject(error)
			});
		} else {
			promise.reject();
		}
		return promise.promise();
	};

	return xbmc;

}).call(this, window.xbmc || {}, jQuery);
console.log("XBMC loaded", xbmc);