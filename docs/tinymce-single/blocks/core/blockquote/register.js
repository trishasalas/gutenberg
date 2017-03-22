( function( wp ) {

	var schema = (
		[ 'blockquote',
			'*',
			[ 'footer' ]
		]
	);

	function insertEmpty() {
		return [ 'blockquote', [ 'p' ], [ 'footer' ] ];
	}

	function fromBaseState( list ) {
		return _.concat( [ 'blockquote' ], list, [ [ 'footer' ] ] );
	}

	function toBaseState( element, helpers ) {
		return _.filter( helpers.getChildren( element ), function( child ) {
			return helpers.getName( child ) !== 'footer';
		} );
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
