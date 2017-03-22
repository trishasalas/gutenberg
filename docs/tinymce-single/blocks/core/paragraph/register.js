window.wp.blocks.registerBlock( {
	name: 'text',
	namespace: 'wp',
	displayName: 'Paragraph',
	elements: [ 'p' ],
	type: 'text',
	editable: [ '' ],
	section: 'text',
	icon: 'gridicons-paragraph',
	controls: [
		'text-switcher',
		'|',
		'text-align-left',
		'text-align-center',
		'text-align-right'
	],
	fromBaseState: function( list ) {
		return list;
	},
	toBaseState: function( element ) {
		return element;
	},
	insert: function() {
		return [ 'p' ];
	}
} );
