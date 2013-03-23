/**
 * XBMC Websockets client
 * @author Jim O'Brien
 */

window.xbmc = (function(xbmc, undefined) {

	var XBMC = function(options) {
		_.extend(this, options);
		this.jsonrpc = jsonrpc(this.host, this.port);
		this.events = {};
		this.subscribeEvents();
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
		this.jsonrpc.on('Flingr.Event', function(data) {
			_this.triggerEvent(data.method, data.params || {});
			_this.triggerEvent('Flingr.Event', data || {});
		});
		console.log('Subscribed to events from ', this.host);
	};

	XBMC.prototype.triggerEvent = function(event, params) {
		if(_.isArray(this.events[event])) {
			console.log('Triggering XBMC event', event);
			_.each(this.events[event], function(ev) {
				ev(params, host, event);
			});
		}
	};

	XBMC.prototype.on = function(event, callback) {
		if(_.isFunction(callback)) {
			if(_.isArray(this.events[event])) {
				this.events[event].push(callback);
			} else {
				this.events[event] = [callback];
			}
		}
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
			this.events = {};
		}
	};

	xbmc.createHost = function(hostOptions) {
		return new XBMC(hostOptions);
	};

	return xbmc;

}).call(this, window.xbmc || {});
console.log("XBMC loaded", xbmc);