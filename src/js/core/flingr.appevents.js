/**
 * flingr Chrome App Events Page
 * @author Jim O'Brien
 */

(function(app, _, undefined) {

	var connectHost = function(host, port) {
		var xbmc = new flingr.xbmc({
			host: host || 'localhost',
			port: port || 9090
		});
		return xbmc.init();
	};

	app.runtime.onLaunched.addListener(function(launchData) {
		new flingr.uiLoader(connectHost, launchData);
	})

}).call(this, chrome.app, _);