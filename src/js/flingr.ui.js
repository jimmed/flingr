/**
 * flingr Chrome App Console UI client
 * @author Jim O'Brien
 */

window.flingr = (function(flingr, $, undefined) {
	
	flingr.ui = function(element) {
		this.$elem = $(element);
		this.components = {};
		this.init();
	};

	flingr.ui.prototype.renderTemplate = function(template, context, target, targetReplace) {
		var promise = $.Deferred();
		
		dust.render('dust.' + template, context || {}, function(err, output) {
			if(err) {
				promise.reject(err.message);
			} else {
				if(target) {
					$(target)[targetReplace ? 'html' : 'append'](output);
				}
				promise.resolve(output);
			}
		});

		return promise.promise();
	};

	flingr.ui.prototype.render = function(pageName, context) {
		var _this = this,
			promise = $.Deferred();

		this.renderTemplate(pageName, context, _this.$elem, true)
			.done(function() {
				promise.resolve(_this.$elem);
			})
			.fail(function(error) {
				promise.reject(error);
			});

		return promise.promise();
	};

	flingr.ui.prototype.setupUi = function() {
		var _this = this,
			components = {
				'log': '#ConsoleOutput',
				'settingsForm': '#SettingsForm',
				'remote': '#remote',
				'nowPlaying': '#nowPlaying'
			};

		_.each(components, function(selector, name) {
			var $elem = $(selector, _this.$elem);
			_this.components[name] = new flingr[name]($elem, _this.host, function() {
				return _this.renderTemplate.apply(_this, arguments);
			});
		});

		return this;
	};

	// TODO: Separate connection form into separate file
	flingr.ui.prototype.setupConnectionHandler = function($host, connect) {
		var _this = this,
			$hostname = $('#hostname', $host),
			$port = $('#port', $host);

		$host.one('submit', function(ev) {
			var hostname = $hostname.val() || $hostname.prop('placeholder'),
				port = $port.val() || $port.prop('placeholder');

			$hostname.val(hostname);
			$port.val(port);
			connect(hostname, port);
			ev.preventDefault();
			return false;
		});

		return $host;
	};
	
	flingr.ui.prototype.onConnect = function(XBMC, renderPage) {
		var _this = this,
			getSettings = flingr.settings.getAll();

		// TODO: Remove this
		flingr.activeHost = XBMC;

		// TODO: Render first, introspect later
		this.host = XBMC;
		XBMC.introspect().done(function() {
			getSettings.done(function(settings) {
				var context = {
						api: XBMC.api,
						settings: settings
					};

				_this.render('browser', context).done(function() {
					_this.setupUi(_this.$elem);
				});
			});
		}).fail(function(error) {
			console.error('Error introspecting', error);
		})
	};

	// TODO: Fix connection error handling
	flingr.ui.prototype.onDisconnect = function(error) {
		this.renderTemplate('home', {error: error}, '[data-content]', true);
	};

	flingr.ui.prototype.init = function() {
		var _this = this,
			$hostForm = $('#hostForm'),
			$controls = $('input, button', $hostForm),
			$button = $('button', $hostForm),
			disconnect = function(error) {
				console.log('Disconnected');
				$button.removeClass('btn-success').addClass('btn-info').text('Connect').prop('disabled', false);
				$controls[0].focus();
				_this.onDisconnect(error);
				_this.setupConnectionHandler($hostForm, connect);
			},
			connect = function(host, port) {
				$controls.prop('disabled', true);
				console.log('Connecting to', host, port);

				flingr.connect(host, port).done(function(XBMC){
					$button.text('Connected').removeClass('btn-info').addClass('btn-success');
					
					$hostForm.off('submit').on('submit', function(ev) {
						ev.preventDefault();
						disconnect();
					});

					$controls.prop('disabled', false);
					
					console.log('XBMC Connected', XBMC);
					
					_this.onConnect(XBMC, function() { _this.render.apply(_this, arguments) });
					
					XBMC.on('JSONRPC.Disconnect', disconnect)

					// TODO: Handle disconnection
				}).fail(disconnect);
			};

		// The UI launcher adds a method to return an XBMC object given a host/port.
		if(!flingr && !flingr.connect) {
			console.warn('Background window hasn\'t provided connection function.');
		} else {
			_this.setupConnectionHandler($hostForm, connect);
			flingr.settings.get(['AutoConnectHost','AutoConnectPort']).done(function(settings) {
				if(settings.AutoConnectHost && settings.AutoConnectPort) {
					connect(settings.AutoConnectHost, settings.AutoConnectPort);
				}
			});
			_this.render('home');
		}
	};

	return flingr;
})(window.flingr || {}, jQuery);