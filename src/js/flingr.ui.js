/**
 * flingr Chrome App Console UI client
 * @author Jim O'Brien
 */

(function(window, $, undefined) {

	var render = function(template, context, target, targetReplace) {
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
		},
		renderPage = function(pageName, context) {
			var $page = $('[data-content]'),
				promise = $.Deferred();
			if($page.length) {
				render(pageName, context, $page, true).fail(function(error) {
					promise.reject(error);
				}).done(function() {
					promise.resolve($page);
				});
			}
			return promise.promise();
		},
		setupBrowserHandlers = function($page, XBMC) {
			var $consoleInput = $('#ConsoleInput', $page),
				$consoleOutput = $('#ConsoleOutput', $page),
				$consoleBody = $('#ConsoleOutputBody', $consoleOutput),
				addConsoleRow = function(row) {
					console.log('Adding row', row);
					$('.empty-table-notice', $consoleBody).hide();
					return render('console.output.row', row, $consoleBody, false).fail(function(error) {
						console.error(error);
					});
				};

			addConsoleRow({action: 'notification', method: 'JSONRPC.Ready'});
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
		};
		setupConnectionHandler = function($host, connect) {
			var $hostname = $('#hostname', $host),
				$port = $('#port', $host);

			$host.on('submit', function(ev) {
				var hostname = $hostname.val() || $hostname.prop('placeholder'),
					port = $port.val() || $port.prop('placeholder');

				$hostname.val(hostname);
				$port.val(port);
				connect(hostname, port);
				ev.preventDefault();
				return false;
			});

			return $host;
		},
		onConnect = function(XBMC, renderPage) {
			window.flingr.activeHost = XBMC;
			XBMC.introspect().done(function(host) {
				console.log('Introspection complete', host);
				renderPage('browser', {api: host}).done(function($page) {
					setupBrowserHandlers($page, host);
				});
			}).fail(function(error) {
				console.error('Error introspecting', error);
			})
		},
		onError = function(error) {
			render('error', error, '[data-content]');
		};

	$(function() {
		var $hostForm = $('#hostForm');

		// The UI launcher adds a method to return an XBMC object given a host/port.
		if(!flingr && !flingr.connect) {
			console.warn('Background window hasn\'t provided connection function.');
		} else {
			setupConnectionHandler($hostForm, function(host, port) {
				var $controls = $('input, button', $hostForm),
					$button = $('button', $hostForm);

				$controls.prop('disabled', true);
				console.log('Connecting to', host, port);

				flingr.connect(host, port).done(function(XBMC){
					$button.text('Connected').removeClass('btn-info').addClass('btn-success');
					$controls.prop('disabled', false);
					
					console.log('XBMC Connected', XBMC);
					
					onConnect(XBMC, renderPage);
					
					XBMC.on('XBMC.Event', function() {
						console.log('XBMC Event', arguments);
					});

					// TODO: Handle disconnection
				}).fail(function(error) {
					$button.removeClass('btn-success').addClass('btn-info').prop('disabled', false);
					$controls[0].focus();
					if(error && error[1]) {
						onError({
							title: 'Connection Error', 
							message: 'Could not connect to <strong>' + host + '</strong> on port <strong>' + port + '</strong>.'
						});
					}
				});
			});
			renderPage('home');
		}
	});


}).call(this, window, jQuery);