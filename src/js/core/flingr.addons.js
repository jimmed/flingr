/**
 * Flingr Addons handler
 * @author Jim O'Brien
 */
window.flingr = window.flingr || {};
window.flingr.addons = (function(addons, $, _, undefined) {
	var handlers = [];

	addons = function(api) {
		this.api = api;
	};

	addons.prototype.addHandler = function(handler) {
		handlers.push(handler);
		return this;
	};
	addons.prototype.openUrl = function(url, handlerId) {
		var promise = $.Deferred(),
			handler = handlerId 
				? handlerId
				: _.find(handlers, function(handler) {
					return handler.match.test(url);
				});

		if(!handler || !_.isFunction(handler.open)) {
			console.warn('No handler found', handler);
			promise.reject();
		} else {
			handler.open(url, this.api).pipe(promise);
		}

		return promise.promise();
	};

	return addons;
})(window.flingr.addons, jQuery, _);