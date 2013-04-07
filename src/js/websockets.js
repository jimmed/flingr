/**
 * Websockets client
 * @author Jim O'Brien
 */

window.ws = (function(ws, _, undefined) {

	ws = function(host, port) {
		var socketAddress = ['ws://', host, ':', port, '/'].join(''),
			socket = new WebSocket(socketAddress),
			events = {},
			trigger,
			addListener;

		trigger = function(event, data) {
			if(_.isArray(events[event])) {
				_.each(events[event], function(ev) {
					ev(data, event);
				});
			}
		};

		// Simple event wrappers
		socket.onerror = function(error) { trigger('error', error); };
		socket.onopen = function() { trigger('open'); };
		socket.onmessage = function(data) { trigger('data', data.data || data); };
		socket.onclose = function() { console.error('Socket closed'); trigger('close'); };

		// Force events to fire
		if(socket.readyState == 1) {
			trigger('open');
		} else if(socket.readyState == 3) {
			trigger('close');
		}

		return {
			on: function(event, callback) {
				if(!events[event]) {
					events[event] = [callback];
				} else {
					events[event].push(callback);
				}
				return this;
			},
			close: function(callback) {
				if(_.isFunction(callback)) {
					this.on('close', callback);
				}
				socket.close();
				return this;
			},
			send: function(data) {
				try {
					socket.send(data);
				} catch(e) {
					console.error('Error sending to websocket', data);
				}
				return this;
			}
		};
	};

	return ws;

}).call(this, window.ws, _);