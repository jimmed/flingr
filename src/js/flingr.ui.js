/**
 * flingr Chrome App UI client
 * @author Jim O'Brien
 */

window.flingrUI = (function(ui, launch, _, $, undefined) {

	ui = function(hosts, launchData, callback) {
		var _this = this;
		console.info("Launching UI", launchData, hosts);
		launch("console.html", {
			bounds: {
				width: 800,
				height: 600,
				left: 100,
				top: 100
			}
		}, function(win) {
			console.log("Window launched", win.contentWindow);
			win.contentWindow.flingr = {
				hosts: hosts
			};
			if(_.isFunction(callback)) {
				callback(win.contentWindow, hosts);
			}
		});
	};

	return ui;

}).call(this, window.flingrUI || {}, chrome.app.window.create, _, jQuery);