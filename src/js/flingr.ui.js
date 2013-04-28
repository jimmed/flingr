/**
 * flingr Chrome App Console UI client
 * @author Jim O'Brien
 */

window.flingr = (function(flingr, $, undefined) {
	
	flingr.ui = function() {};

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
		})
		return promise.promise();
	};

	flingr.ui.prototype.render = function(pageName, context) {
		var $page = $('[data-content]'),
			promise = $.Deferred();
		if($page.length) {
			this.renderTemplate(pageName, context, $page, true).fail(function(error) {
				promise.reject(error);
			}).done(function() {
				promise.resolve($page);
			});
		}
		return promise.promise();
	};

	flingr.ui.prototype.setupUi = function($page, XBMC) {
		var _this = this,
			$apiInput = $('#ConsoleInput', $page),
			$consoleOutput = $('#ConsoleOutput', $page),
			$consoleBody = $('#ConsoleOutputBody', $consoleOutput),
			$apiForm = $('form', $apiInput),
			$settings = $('#SettingsForm', $page),
			$remote = $('#remote', $page),
			addConsoleRow = function(row) {
				$('.empty-table-notice', $consoleBody).hide();
				return _this.renderTemplate('console.output.row', row, $consoleBody, false).fail(function(error) {
					console.error(error);
				});
			};

		_this.setupSettingsForm($settings);
		console.log('Setting up remote', $remote);
		_this.setupRemote($remote, XBMC.api);

		// Subscribe to events from our XBMC host
		XBMC.on('XBMC.Event', function(params, event) {
			if(params.method && params.params) {
				addConsoleRow({action: 'notification', method: params.method, data: params.params.data})
			}
		});
		XBMC.on('XBMC.Request', function(params, event) {
			if(params.method && params.params) {
				addConsoleRow({action: 'request', method: params.method, data: params.params})
			}
		});
		XBMC.on('XBMC.Response', function(params, event) {
			if(params.method && params.result !== undefined) {
				addConsoleRow({action: 'response', method: params.method, data: params.result})
			}
		});

		// Add a listener for our API command form
		//setupApiForm($apiForm, XBMC.api).find('select:eq(0)').trigger('change');
		
	};

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

	flingr.ui.prototype.setupApiForm = function($form, api, inputData, noRedraw) {
		var _this = this,
			$ms = $('#MethodSelector', $form),
			$params = $('#Parameters', $form),
			defaults = {},
			data;

		// Extract defaults from the API
		$.each(api, function(method){
			defaults['Method'] = method;
			$.each(api[method], function(methodGroup) {
				defaults['MethodGroup'] = methodGroup;
			})
			return false;
		});

		// Overwrite defaults with input data
		data = $.extend({}, defaults, inputData);
		
		// Update the method selector
		$ms.on('change', 'select', function(event) {
			var context = {api:api},
				$fields = $('select', $ms),
				paramContext;

			$fields.each(function() {
				data[$(this).prop('id')] = $(this).val();
			});
			$.extend(context, data);
			if(context.MethodGroup) {
				context.selectedMethodGroup = api[context.MethodGroup];
				if(context.Method) {
					context.selectedMethod = context.selectedMethodGroup[context.Method];
				}
			}

			_this.renderTemplate('console.input.form.methodSelector', context, $ms, true).done(function() {
				_this.setupApiForm($form, api, data, true);
			});
			if(context.selectedMethod) {
				paramContext = {params: context.selectedMethod};
				_this.renderTemplate('console.input.form.parameters', paramContext, $params, true);
			}
			if(event) event.preventDefault();
		});

		$form.on('submit', function(event) {
			event.preventDefault();
			console.log(data);
			return false;
		});
		return $form;
	};

	flingr.ui.prototype.setupSettingsForm = function($form) {
		var _this = this;
		console.log('Setting up', $form);
		$form.on('change', 'input, select', function(event) {
			var $field = $(this),
				key = $field.prop('id'),
				value = $field.val(),
				updates = {};

			if($field.prop('type') == 'checkbox') {
				value = value === 'on';
			}

			updates[key] = value;
			flingr.settings.set(updates).done(function() {
				flingr.settings.getAll().done(function(values) {
					_this.renderTemplate('settings', values, '#settings', true).done(function() {
						_this.setupSettingsForm($form);
					});
				});
			});
		})
		return $form;
	};

	flingr.ui.prototype.setupRemote = function($elem, api) {
		var remote = new flingr.remote($elem, api);
	};
	
	flingr.ui.prototype.onConnect = function(XBMC, renderPage) {
		var getSettings = flingr.settings.getAll(),
			_this = this;
		console.log('Connection established');
		window.flingr.activeHost = XBMC;
		XBMC.introspect().done(function(host) {
			getSettings.done(function(settings) {
				var context = {
						api: host,
						settings: settings
					};
				_this.render('browser', context).done(function($page) {
					_this.setupUi($page, host);
					new flingr.nowPlaying(host, '#nowPlaying', function() {
						return _this.renderTemplate.apply(_this, arguments);
					});
				});
			});
		}).fail(function(error) {
			console.error('Error introspecting', error);
		})
	};

	flingr.ui.prototype.onDisconnect = function(error) {
		this.renderTemplate('home', {error: error}, '[data-content]', true);
	};

	flingr.ui.prototype.init = function() {
		var _this = this,
			$hostForm = $('#hostForm'),
			$controls = $('input, button', $hostForm),
			$button = $('button', $hostForm),
			disconnect = function(error) {
				console.log('Disconnect');
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
					
					XBMC.on('XBMC.Event', function() {
						console.log('XBMC Event', arguments);
					});

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

$(function() {
	var UI = new flingr.ui;
	UI.init();
})