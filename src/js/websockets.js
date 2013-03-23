/**
 * Websockets client
 * @author Jim O'Brien
 */

window.ws = (function(ws, window, _, undefined) {

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

		addListener = function(event, callback) {
			if(!events[event]) {
				events[event] = [callback];
			} else {
				events[event].push(callback);
			}
		};

		socket.onerror = function(error) {
			trigger('error', error);
		};
		socket.onopen = function() {
			trigger('open');
		};
		socket.onmessage = function(data) {
			trigger('message', data.data || data);
		};
		socket.onclose = function() {
			trigger('close');
		};

		return {
			open: function(callback) {
				addListener('open', callback);
				return this;
			},
			close: function(callback) {
				addListener('close', callback);
				socket.close();
				return this;
			},
			send: function(data) {
				socket.send(data);
				return this;
			},
			listen: function(callback) {
				addListener('message', callback);
			}
		};
	};

	return ws;

}).call(this, window.ws, window, _);