window.wp = window.wp || {};
window.wp.mce = window.wp.mce || {};
window.wp.mce.middleware = ( function( DOMHelpers ) {

	function moveUp( editor, indices ) {
		$blocks = editor.$( DOMHelpers.getBlockNodes( indices, editor.getBody() ) );
		$first = $blocks.first();
		$last = $blocks.last();
		$prev = $first.prev();

		rect = $first[0].getBoundingClientRect();

		if ( $prev.length ) {
			editor.undoManager.transact( function() {
				$last.after( $prev );
			} );

			window.scrollBy( 0, - rect.top + $first[0].getBoundingClientRect().top );
		}
	}

	function moveDown( editor, indices ) {
		$blocks = editor.$( DOMHelpers.getBlockNodes( indices, editor.getBody() ) );
		$first = $blocks.first();
		$last = $blocks.last();
		$next = $last.next();

		rect = $first[0].getBoundingClientRect();

		if ( $next.length ) {
			editor.undoManager.transact( function() {
				$first.before( $next );
			} );

			window.scrollBy( 0, - rect.top + $first[0].getBoundingClientRect().top );
		}
	}

	function replaceBlock( editor, index, content ) {
		var path = DOMHelpers.getPathAtMarker( content, '\u0086' );
		var oldNode = DOMHelpers.getBlockNode( index, editor.getBody() )
		var newNode = DOMHelpers.JSONToDOM( content );

		editor.undoManager.transact( function() {
			oldNode.parentNode.replaceChild( newNode, oldNode );

			if ( path ) {
				var selectedNode = DOMHelpers.findNodeWithPath( path, newNode );

				if ( selectedNode ) {
					editor.selection.setCursorLocation( selectedNode, path[ path.length - 1 ] );
					return;
				}
			}

			var brs = newNode.getElementsByTagName( 'BR' );

			if ( brs.length ) {
				editor.selection.setCursorLocation( brs[0].parentNode, 0 );
			} else {
				editor.selection.select( newNode );
			}
		} );
	}

	return function( dispatch, getState ) {
		return function( next ) {
			return function( action ) {
				if ( action.editor ) {
					if ( action.type === 'CONTENT_MOVE_UP' ) {
						moveUp( action.editor, action.indices );
					}

					if ( action.type === 'CONTENT_MOVE_DOWN' ) {
						moveDown( action.editor, action.indices );
					}

					if ( action.type === 'CONTENT_REPLACE_BLOCK' ) {
						replaceBlock( action.editor, action.index, action.content );
					}

					action = {
						type: 'SET_CONTENT',
						content: DOMHelpers.DOMToJSON( action.editor.getBody(), true )
					};
				}

				console.log( action );

				return next( action );
			};
		};
	}

} )( window.wp.DOMHelpers );
