/**
 * Flingr Remote UI handler
 * @author Jim O'Brien
 */
window.flingr = window.flingr || {};
window.flingr.remote = (function(remote, $, _, undefined) {

	remote = function(element, api) {
		console.log(element, api);
		this.api = api;
		this.context = {};
		this.$elem = $(element);
		this.addons = new flingr.addons(api);
		this.setup();
	};

	remote.prototype.setup = function() {
		var _this = this;
		this.$elem
			.on('keydown', '#virtualKeyboard', function(ev) {
				var key = ev.keyCode,
					map = {
						37: 'Left',
						38: 'Up',
						39: 'Right',
						40: 'Down',
						13: 'Select',
						8: 'Back',
						27: 'Back',
						17: 'ContextMenu'
					},
					apiName = map[key];

				if(apiName) {
					_this.api.Input[apiName].send()
				} else {
					_this.api.Input.SendText.send({
						text: String.fromCharCode(key),
						done: false
					});
				}
				ev.preventDefault();
			})
			.on('keypress', '#openUrl', function(ev) {
				var $el = $(this),
					url = $el.val();
				
				if(ev.keyCode == 13) {
					$el.val('');
					_this.addons.openUrl(url);
				}

			});
	};


	return remote;
})(window.flingr.remote || {}, jQuery, _);