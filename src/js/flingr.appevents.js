/**
 * flingr Chrome App Events client
 * @author Jim O'Brien
 */

(function(app, _, undefined) {

	var testingData = {	Hosts: [ { "id": "Living Room", "host": "pi", "port": 9090 } ] },
		hostData = testingData.Hosts,
		hosts = _.map(hostData, xbmc.createHost);

	app.runtime.onLaunched.addListener(function(launchData) {
		new flingrUI(hosts, launchData);
	})

}).call(this, chrome.app, _);