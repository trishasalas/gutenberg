( function( wp ) {

	function insertEmpty() {
		return { name: 'pre' };
	}

	function toBaseState( state ) {
		return {
			name: 'p',
			children: state.children
		};
	}

	function fromBaseState( state ) {
		return {
			name: 'pre',
			children: state.children
		};
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
