/**
 * flingr Chrome App UI client
 * @author Jim O'Brien
 * TODO: Cut out this middle man
 */

window.flingr = (function(flingr, launch, _, $, undefined) {

	flingr.uiLoader = function(connect, launchData, callback) {
		var _this = this;
		launch("console.html", {
			bounds: {
				width: 800,
				height: 600,
				left: 100,
				top: 100
			},
			minWidth: 520,
			minHeight: 280
		}, function(win) {
			win.contentWindow.flingr = {
				connect: connect
			};
			if(_.isFunction(callback)) {
				callback(win.contentWindow, connect);
			}
		});
	};

	return flingr;

}).call(this, window.flingr || {}, chrome.app.window.create, _, jQuery);