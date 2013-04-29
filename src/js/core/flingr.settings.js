/**
 * Flingr localStorage Wrapper
 * @author Jim O'Brien
 */
window.flingr = window.flingr || {};
window.flingr.settings = (function(settings, $, _, undefined) {
	var storage = chrome.storage.local;
	
	settings.defaults = {
		AutoConnectHost: false,
		AutoConnectPort: 9090
	};

	settings.get = function(key) {
		var promise = $.Deferred();
		storage.get(key, function(values) {
			promise.resolve(values);
		});
		return promise.promise();
	};

	settings.set = function(updates) {
		var promise = $.Deferred();
		storage.set(updates, function() {
			promise.resolve();
		});
		return promise.promise();
	};

	settings.getAll = function() {
		var promise = $.Deferred();
		settings.get(_.keys(settings.defaults)).done(function(values) {
			promise.resolve(_.defaults(values, settings.defaults));
		});
		return promise.promise();
	}

	return settings;
})(window.flingr.settings || {}, jQuery, _);