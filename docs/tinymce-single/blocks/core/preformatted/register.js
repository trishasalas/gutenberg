( function( wp ) {

	function insertEmpty() {
		return [ 'pre' ];
	}

	function fromBaseState( list, helpers ) {
		return _.map( list, function( element ) {
			return helpers.setName( element, 'pre' );
		} );
	}

	function toBaseState( element, helpers ) {
		return helpers.setName( element, 'p' );
	}

	window.wp.blocks.registerBlock( {
		name: 'preformatted',
		namespace: 'wp',
		displayName: 'Preformatted',
		elements: [ 'pre' ],
		type: 'text',
		editable: [ '' ],
		icon: 'gridicons-code',
		placeholders: {
			'': 'Write preformatted text\u2026'
		},
		controls: [
			'text-switcher',
			'|',
			{
				icon: 'gridicons-cog',
				onClick: function() {}
			}
		],
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState
	} );

} )( window.wp );
