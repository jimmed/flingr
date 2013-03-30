(function(dust, $) {
	dust.helpers.object = function(chunk, context, bodies, params) {
		params = params || {};
		if(!$.isPlainObject(params.input)) {
			console.warn('Input parameter to @objectKeys must be a plain object');
		}

		var isEmpty = true;
		if(bodies.block) {
			for(var key in params.input) {
				isEmpty = false;
				var localContext = context.push({key: key, value: params.input[key]});
				// TODO: Seems like a hack. Probably is a hack. Shouldn't be a hack
				if(localContext && localContext.stack && localContext.stack.tail && localContext.stack.tail.head) {
					localContext = localContext.push(localContext.stack.tail.head);
				}
				chunk.render(bodies.block, localContext);
			}
		}
		if(isEmpty && bodies.empty) {
			chunk.render(bodies.empty, context);
		}
		return chunk;
	};

	var dustUuids = {};
	dust.helpers.uuid = function(chunk, context, bodies, params) {
		var uuid;
		params = params || {};
		if(params.key && $.isFunction(params.key)) {
			params.key = params.key(chunk, context);
		}
		if(params.key && dustUuids[params.key]) {
			uuid = dustUuids[params.key];
		} else {
			uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}
		if(params.key) {
			dustUuids[params.key] = uuid;
		}
		console.log(params.key);
		return chunk.write(uuid);
	};

	dust.filters.a = function(i) { return i.replace(/[^a-z0-9]/gi, '_'); }
})(dust || {}, jQuery, undefined);