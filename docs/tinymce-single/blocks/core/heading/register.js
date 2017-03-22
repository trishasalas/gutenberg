( function( wp ) {

	function getControls() {
		var controls = [];

		controls.push( 'text-switcher', '|' );

		'123456'.split( '' ).forEach( function( level ) {
			controls.push( {
				icon: 'gridicons-heading',
				text: level,
				stateSelector: 'h' + level,
				onClick: function( content, helpers ) {
					console.log(helpers)
					return helpers.setName( content, 'h' + level );
				}
			} );
		} );

		controls.push( '|', 'text-align-left', 'text-align-center', 'text-align-right' );

		return controls;
	}

	function fromBaseState( list, helpers ) {
		return _.map( list, function( element ) {
			return helpers.setName( element, 'h1' );
		} );
	}

	function toBaseState( element, helpers ) {
		return helpers.setName( element, 'p' );
	}

	wp.blocks.registerBlock( {
		name: 'heading',
		namespace: 'wp',
		displayName: 'Heading',
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
		type: 'text',
		editable: [ '' ],
		placeholders: {
			'': 'Write heading\u2026'
		},
		icon: 'gridicons-heading',
		controls: getControls(),
		toBaseState: toBaseState,
		fromBaseState: fromBaseState,
		insert: function() {
			// Maybe detect best heading based on document outline.
			return [ 'h1' ];
		}
	} );

} )( window.wp );
