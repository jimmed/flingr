/**
 * Flingr settingsForm UI handler
 * @author Jim O'Brien
 */

window.flingr = window.flingr || {};
window.flingr.settingsForm = (function(settingsForm, $, _, undefined) {

	settingsForm = function(element, host, renderer) {
		this.host = host;
		this.context = {};
		this.$elem = $(element);
		this.render = renderer;
		this.setup();
	};

	settingsForm.prototype.setup = function() {
		var _this = this;

		this.$elem.on('change', 'input, select', function(event) {
			var $field = $(this),
				key = $field.prop('id'),
				value = $field.val();

			if($field.prop('type') == 'checkbox') {
				value = value === 'on';
			}

			_this.saveSetting(key, value);
		});

		return this;
	};

	settingsForm.prototype.saveSetting = function(key, value) {
		var _this = this,
			updates = {};
		
		updates[key] = value;
		flingr.settings.set(updates).done(function() {
			flingr.settings.getAll().done(function(values) {
				_this.render('settings', values, _this.$elem, true).done(function() {
					_this.setup();
				});
			});
		});

		return this;
	};

	return settingsForm;
})(window.flingr.settingsForm || {}, jQuery, _);