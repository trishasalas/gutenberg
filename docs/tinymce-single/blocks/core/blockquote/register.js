( function( wp ) {

	function insertEmpty() {
		return {
			name: 'blockquote',
			children: [
				{ name: 'p' },
				{ name: 'footer' }
			]
		};
	}

	function fromBaseState( state ) {
		return {
			name: 'blockquote',
			children: _.concat(
				state,
				{ name: 'footer' }
			)
		};
	}

	function toBaseState( state ) {
		return state.children;
	}

	wp.blocks.registerBlock( {
		name: 'quote',
		namespace: 'wp',
		displayName: 'Quote',
		elements: [ 'blockquote' ],
		type: 'text',
		icon: 'gridicons-quote',
		editable: [ '', 'footer' ],
		placeholders: {
			'': 'Write quote\u2026',
			footer: 'Write citation\u2026'
		},
		controls: [
			'text-switcher'
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState
	} );

} )( window.wp );
