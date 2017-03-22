/**
 * Connects the TinyMCE instance to the Redux store.
 */
( function( tinymce, store, DOMHelpers, _, stateSelectors ) {

	tinymce.PluginManager.add( 'wp:blocks:connect', function( editor ) {

		editor.on( 'keydown blur', function( event ) {
			if ( tinymce.util.VK.metaKeyPressed( event ) ) {
				return;
			}

			if ( stateSelectors.isUIShown( store.getState() ) ) {
				store.dispatch( { type: 'HIDE_UI' } );
			}
		} );

		editor.on( 'mousedown touchstart setSelectionRange', function( event ) {
			var state = store.getState();

			if ( stateSelectors.isDragging( state ) ) {
				return;
			}

			// Show UI on setSelectionRange for non editable blocks.
			if ( event.range ) {
				if ( editor.selection.getNode().isContentEditable ) {
					return;
				}
			}

			if ( ! stateSelectors.isUIShown( state ) ) {
				store.dispatch( { type: 'SHOW_UI' } );
			}
		} );

		editor.on( 'mouseover', _.debounce( function( event ) {
			var target = DOMHelpers.getParentBlock( event.target, editor.getBody() );
			var state = store.getState();
			var index = -1;

			if ( target ) {
				index = DOMHelpers.getChildIndex( target );
			}

			if ( index !== stateSelectors.getHoverIndex( state ) ) {
				store.dispatch( { type: 'UPDATE_HOVER_INDEX', index: index } );
			}
		}, 100 ) );

		/**
		 * General note: reading the DOM is fast,
		 * but any form of optimisation here is welcome.
		 */
		editor.on( 'init', function() {

			store.dispatch( {
				type: 'SET_CONTENT',
				content: DOMHelpers.DOMToJSON( editor.getBody(), true )
			} );

			/**
			 * selectionChange: Fires when the selection changes, but also on input.
			 * nodeChange: Fires when the UI needs to be updated (after a content change).
			 */
			editor.on( 'selectionChange nodeChange', function( event ) {
				var rootNode = editor.getBody();
				var startNode = editor.selection.getStart();

				if ( ! rootNode.contains( startNode ) ) {
					return;
				}

				if ( startNode.id === 'mcepastebin' ) {
					return;
				}

				var state = store.getState();

				if ( stateSelectors.isDragging( state ) ) {
					return;
				}

				var endNode = editor.selection.getEnd();
				var range = editor.selection.getRng();
				var isCollapsed = editor.selection.isCollapsed();
				var selection = DOMHelpers.createSelectionPath( range, startNode, endNode, isCollapsed, rootNode );

				if ( ! _.isEqual( selection, state.selection ) ) {
					store.dispatch( {
						type: 'SET_SELECTION',
						selection: selection
					} );
				}

				if ( stateSelectors.isInserterShown( state ) ) {
					store.dispatch( {
						type: 'SHOW_INSERTER',
						show: false
					} );
				}

				var moved = event._WPBlockMoved;

				// A block has been deleted.
				// Quick check.
				if ( moved || state.content.length !== rootNode.children.length ) {
					var newContent = DOMHelpers.DOMToJSON( rootNode, true );

					// Actual check.
					if ( moved || state.content.length !== newContent.length ) {
						store.dispatch( {
							type: 'SET_CONTENT',
							content: newContent
						} );

						return;
					}
				}

				if ( stateSelectors.getSelectedBlockIndex( state ) !== -1 ) {
					var currentContent = stateSelectors.getSelectedBlockContent( state );
					var blockNode = stateSelectors._getSelectedBlockNode( state, rootNode );
					var blockContent = DOMHelpers.DOMToJSON( blockNode );

					// A block has been updated.
					if ( ! _.isEqual( currentContent, blockContent ) ) {
						store.dispatch( {
							type: 'SET_SELECTED_BLOCK_CONTENT',
							content: blockContent
						} );
					}
				}
			} );

			editor.on( 'newBlock', function() {
				store.dispatch( {
					type: 'SET_CONTENT',
					content: DOMHelpers.DOMToJSON( editor.getBody(), true )
				} );
			} );

		} );

	} );

} )( window.tinymce, window.store, window.wp.DOMHelpers, window._, window.wp.stateSelectors );
