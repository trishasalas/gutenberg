( function( wp ) {

	var schema = {
		name: 'section',
		children: '*'
	};

	function insertEmpty() {
		return {
			name: 'section',
			children: [ { name: 'p' } ]
		};
	}

	function fromBaseState( state ) {
		return {
			name: 'section',
			attributes: {
				'data-wp-block-type': 'my-awesome-plugin:custom-blue-box',
			},
			children: [ state ]
		};
	}

	function toBaseState( state ) {
		return state.children;
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
