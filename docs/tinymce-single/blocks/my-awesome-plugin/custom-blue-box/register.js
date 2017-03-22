( function( wp ) {

	var schema = {
		name: 'section',
		children: '*'
	};

	function insertEmpty() {
		return [ 'section', [ 'p' ] ];
	}

	function fromBaseState( list ) {
		return [ _.concat( [ 'section', { 'data-wp-block-type': 'my-awesome-plugin:custom-blue-box' } ], list ) ];
	}

	function toBaseState( element, helpers ) {
		return helpers.getChildren( element );
	}

	wp.blocks.registerBlock( {
		name: 'custom-blue-box',
		namespace: 'my-awesome-plugin',
		displayName: 'Custom Box',
		icon: 'gridicons-custom-post-type',
		type: 'text',
		editable: [ '' ],
		placeholders: {
			'p:first': 'Write in the magic box! ✨'
		},
		insert: insertEmpty,
		fromBaseState: fromBaseState,
		toBaseState: toBaseState,
		controls: [
			'text-switcher',
			'|',
			'text-align-left',
			'text-align-center',
			'text-align-right'
		]
	} );

} )( window.wp );
