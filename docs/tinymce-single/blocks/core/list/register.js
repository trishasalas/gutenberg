( function( wp ) {

	function insertEmpty() {
		return {
			name: 'ul',
			children: [ { name: 'li' } ]
		};
	}

	function fromBaseState( state ) {
		var items = [ { name: 'li', children: [] } ];

		state.children.forEach( function( child ) {
			if ( child.name === 'br' ) {
				items.push( { name: 'li', children: [] } );
			} else {
				items[ items.length - 1 ].children.push( child );
			}
		} );

		return {
			name: 'ul',
			children: items
		};
	}

	function toBaseState( state ) {
		function itemsToChildren( items ) {
			var children = [];

			items.forEach( function( item, i ) {
				if ( i ) {
					children.push( { name: 'br' } );
				}

				item.children.forEach( function( child ) {
					if ( child.name === 'ul' || child.name === 'ol' ) {
						children.push( { name: 'br' } );
						child = itemsToChildren( child.children )
					}

					children.push( child );
				} );
			} );

			return children;
		}

		return {
			name: 'p',
			children: itemsToChildren( state.children )
		};
	}

	wp.blocks.registerBlock( {
		name: 'list',
		namespace: 'wp',
		displayName: 'List',
		elements: [ 'ul', 'ol' ],
		type: 'text',
		editable: [ '' ],
		icon: 'gridicons-list-unordered',
		base: 'elements:paragraph',
		insert: insertEmpty,
		toBaseState: toBaseState,
		fromBaseState: fromBaseState,
		controls: [
			'text-switcher',
			'|',
			{
				icon: 'gridicons-list-unordered',
				stateSelector: 'ul',
				onClick: function( block, editor ) {
					// Use native command to toggle current selected list.
					// TODO: remove editor dependency.
					editor.execCommand( 'InsertUnorderedList' );
				}
			},
			{
				icon: 'gridicons-list-ordered',
				stateSelector: 'ol',
				onClick: function( block, editor ) {
					// Use native command to toggle current selected list.
					// TODO: remove editor dependency.
					editor.execCommand( 'InsertOrderedList' );
				}
			}
		]
	} );

} )( window.wp );
