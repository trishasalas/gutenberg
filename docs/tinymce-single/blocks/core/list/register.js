( function( wp ) {

	function insertEmpty() {
		return [ 'ul', [ 'li' ] ];
	}

	function fromBaseState( list, helpers ) {
		var result = [ 'ul', [ 'li' ] ];

		_.forEach( list, function( element, i ) {
			i && result.push( [ 'li' ] );

			_.forEach( helpers.getChildren( element ), function( child ) {
				if ( helpers.getName( child ) === 'br' ) {
					result.push( [ 'li' ] );
				} else {
					_.last( result ).push( child );
				}
			} );
		} );

		return result;
	}

	function toBaseState( element, helpers ) {
		function unwrap( items ) {
			var children = [];

			_.forEach( items, function( item, i ) {
				i && children.push( [ 'br' ] );

				_.forEach( helpers.getChildren( item ), function( child ) {
					if ( _.indexOf( [ 'ul', 'ol' ], helpers.getName( child ) ) !== -1 ) {
						children.push( [ 'br' ] );
						children = _.concat( children, unwrap( helpers.getChildren( child ) ) )
					} else {
						children.push( child );
					}
				} );
			} );

			return children;
		}

		return _.concat( [ 'p' ], unwrap( helpers.getChildren( element ) ) );
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
				onClick: function( block, helpers ) {
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
