/**
 * flingr Chrome App Events Page
 * @author Jim O'Brien
 */

(function(app, _, undefined) {

	var connectHost = function(host, port) {
		return xbmc.createHost({
			host: host || 'localhost',
			port: port || 9090
		});
	};

	app.runtime.onLaunched.addListener(function(launchData) {
		new flingrUI(connectHost, launchData);
	})

}).call(this, chrome.app, _);