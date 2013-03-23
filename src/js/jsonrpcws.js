/**
 * Websockets JSONRPC client
 * @author Jim O'Brien
 */

window.jsonrpc = (function(jsonrpc, ws, undefined) {

	jsonrpc = function(host, port) {
		var rpcversion = "2.0",
			lastId = 0,
			socket = ws(host, port),
			events = {},
		    deserialize,
		    serialize,
		    trigger,
		    listenForEvents;

		trigger = function(event, data) {
			if(_.isArray(events[event])) {
				_.each(events[event], function(ev) {
					ev(data, event);
				});
			}
		};

		listenForEvents = _.once(function() {
			socket.on('data', function(json) {
				var data = deserialize(json),
					eventName, errEventName;

				// Responses to our requests will have an 'id' and a 'result' or 'error'
				if(data.id) {
					eventName = 'JSONRPC.Response' + data.id, 
					errEventName = eventName + '.Error';
					if(data.result) {
						trigger(eventName, data.result);
					}
					if(data.error) {
						console.error('JSONRPC error', error);
						trigger(errEventName, data.error);
					}
					events = _.omit(events, [eventName, errEventName]);
				}
				// Event notifications have a 'method', and sometimes 'params'
				else if(data.method) {
					trigger(data.method, data.params || {});
					trigger('JSONRPC.Event', data);
				}
				else {
					console.info('Some kind of unknown data came back from the socket.', json, data);
				}
			});
			socket.on('open', function() { trigger('JSONRPC.Connected') });
			socket.on('close', function() { trigger('JSONRPC.Disconnected') });
			socket.on('error', function(error) { trigger('JSONRPC.SocketError', error) });
		});
		listenForEvents();

		serialize = function(data) {
			var thisId = ++lastId,
				payload = _.extend({
					"jsonrpc": rpcversion,
					"id": thisId
				}, data);
			return {
				id: thisId,
				payload: JSON.stringify(payload)
			};
		};

		deserialize = function(json) {
			var data;
			try {
				data = JSON.parse(json);
			} catch(e) {
				throw new Exception("Response could not be parsed as JSON", json, e);
			}
			if(!data || !data.jsonrpc) {
				throw new Exception("Response does not appear to be valid JSONRPC", data.jsonrpc);
			}
			if(data.jsonrpc !== '2.0') {
				throw new Exception("Response is not JSONRPC v2.0", data.jsonrpc);
			}
			if(!data.result && !data.method && !data.error) {
				throw new Exception("JSONRPC response has no result, method or error", data);
			}
			return _.omit(data, 'jsonrpc');
		};

		return {
			on: function(event, callback) {
				if(!_.isArray(events[event])) {
					events[event] = [callback];
				} else {
					events[event].push(callback);
				}
				return this;
			},
			send: function(data, successCallback, errorCallback) {
				var request = serialize(data),
					eventName = 'JSONRPC.Response' + request.id, 
					errEventName = eventName + '.Error';
				this.on(eventName, successCallback);
				this.on(errEventName, errorCallback);
				socket.send(request.payload);
				return this;
			},
			close: function(callback) {
				socket.on('close', callback).close();
				return this;
			}
		};
	};
	return jsonrpc;

}).call(this, window.jsonrpc || {}, window.ws);