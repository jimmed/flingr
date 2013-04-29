/**
 * Flingr log UI handler
 * @author Jim O'Brien
 */

window.flingr = window.flingr || {};
window.flingr.log = (function(log, $, _, undefined) {

	log = function(element, host, renderer) {
		this.host = host;
		this.context = {};
		this.$elem = $(element);
		this.$body = $('#ConsoleOutputBody', this.$elem);
		this.render = renderer;
		this.setup();
	};

	log.prototype.setup = function() {
		var _this = this,
			eventTypes = {
				'XBMC.Event': function(params) {
					return {
						action: 'notification',
						method: params.method,
						data: params.params.data
					};
				},
				'XBMC.Request': function(params) {
					return {
						action: 'request',
						method: params.method,
						data: params.params
					};
				},
				'XBMC.Response': function(params) {
					return {
						action: 'response',
						method: params.method,
						data: params.result
					};
				}
			};

		_.each(eventTypes, function(makeContext, eventType) {
			_this.host.on(eventType, function(params) {
				_this.renderRow(makeContext(params));
			});
		});

		return this;
	};

	log.prototype.renderRow = function(context) {
		$('.empty-table-notice', this.$body).hide();
		return this.render('console.output.row', context, this.$body, false);
	};


	return log;
})(window.flingr.log || {}, jQuery, _);