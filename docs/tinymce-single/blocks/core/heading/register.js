( function( wp ) {

	function getControls() {
		var controls = [];

		controls.push( 'text-switcher', '|' );

		'123456'.split( '' ).forEach( function( level ) {
			controls.push( {
				icon: 'gridicons-heading',
				text: level,
				stateSelector: 'h' + level,
				onClick: function( state ) {
					return {
						name: 'h' + level,
						children: state.children
					};
				}
			} );
		} );

		controls.push( '|', 'text-align-left', 'text-align-center', 'text-align-right' );

		return controls;
	}

	function toBaseState( state ) {
		return {
			name: 'p',
			children: state.children
		};
	}

	function fromBaseState( state ) {
		return {
			name: 'h1',
			children: state.children
		};
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
			return { name: 'h1' };
		}
	} );

} )( window.wp );
