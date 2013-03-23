/**
 * Spinner rendering using spin.js
 */

flingr.spin = (function(spin, Spinner, undefined) {
	var spinners = {
		'page': {
			lines: 17,
			length: 8,
			width: 4,
			radius: 39,
			corners: 1,
			rotate: 13,
			color: '#000',
			speed: 1.2,
			trail: 71,
			shadow: false,
			hwaccel: true,
			className: 'spinner large',
			zIndex: 2e9,
			top: 'auto',
			left: 'auto'
		}
	};

	spin = function(type, target, overwrite) {	
		var spinner = new Spinner(spinners[type || 'page'] || {});
		if(target) {
			$(target)[overwrite ? 'html' : 'append'](spinner.spin().el);
		}
		return spinner;
	};

	return spin;

})(flingr.spin, Spinner, undefined);