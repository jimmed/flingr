/**
 * Flingr YouTube Addon handler
 * @author Jim O'Brien
 */

(function(add, $, _, undefined) {
	var pattern = /^https?:\/\/(?:www\.)?youtube.com\/watch\?(?=[^?]*v=(\w+))(?:[^\s-_?]+)?$/i,
		pluginUrlBase = 'plugin://plugin.video.youtube/?action=play_video&videoid=';
		
	add({
		match: pattern,
		open: function(url, api) {
			var promise = $.Deferred(),
				parse = url.match(pattern),
				video_id = parse && parse[1];

			if(video_id) {
				api.Player.Open.send({
					item: {
						file: pluginUrlBase + video_id
					}
				}, 10).pipe(promise);
			} else {
				promise.reject('Could not parse URL' + url);
			}

			return promise.promise();
		}
	});
})(window.flingr.addons.prototype.addHandler, jQuery, _);