/**
 * Websockets client
 * @author Jim O'Brien
 */

window.flingr = (function(flingr, _, undefined) {

	flingr.websocket = function(host, port) {
		this.socketAddress = ['ws://', host, ':', port, '/'].join('');
		this.socket = new WebSocket(this.socketAddress);
		this.events = {};
		this.eventListen();
	};

	flingr.websocket.prototype.eventListen = function() {
		var _this = this;

		// Simple event wrappers
		_this.socket.onerror = function(error) { 
			_this.trigger('error', error); 
		};
		_this.socket.onopen = function() { 
			_this.trigger('open'); 
		};
		_this.socket.onmessage = function(data) { 
			_this.trigger('data', data.data || data); 
		};
		_this.socket.onclose = function() { 
			console.error('Socket closed'); 
			_this.trigger('close'); 
		};

		// Force events to fire
		if(_this.socket.readyState == 1) {
			_this.trigger('open');
		} else if(_this.socket.readyState == 3) {
			_this.trigger('close');
		}

		return _this;
	};

	flingr.websocket.prototype.trigger = function(event, data) {
		var _this = this;

		if(_.isArray(_this.events[event])) {
			_.each(_this.events[event], function(ev) {
				ev(data, event);
			});
		}

		return _this;
	};

	flingr.websocket.prototype.on = function(event, callback) {
		var _this = this;

		if(!_this.events[event]) {
			_this.events[event] = [callback];
		} else {
			_this.events[event].push(callback);
		}
		return _this;
	};

	flingr.websocket.prototype.close = function(callback) {
		if(_.isFunction(callback)) {
			this.on('close', callback);
		}
		this.socket.close();

		return this;
	};

	flingr.websocket.prototype.send = function(data) {
		try {
			this.socket.send(data);
		} catch(e) {
			console.error('Error sending to websocket', data);
		}
		return this;
	};

	return flingr;

}).call(this, window.flingr || {}, _);