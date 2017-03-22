window.wp = window.wp || {};
window.wp.stateSelectors = ( function( contentHelpers ) {

	function getSelectedBlockIndex( state ) {
		var start = state.selection.start;
		var end = state.selection.end;

		if ( start[ 0 ] === end[ 0 ] && state.content[ start[ 0 ] ] ) {
			return start[ 0 ];
		}

		return -1;
	}

	function getSelectedBlockIndices( state ) {
		var start = state.selection.start[ 0 ];
		var end = state.selection.end[ 0 ];
		var indices = [];

		if ( start != null ) {
			indices.push( start );

			while ( start !== end ) {
				start++;
				indices.push( start );
			}
		}

		return indices;
	}

	function getSelectedBlockContent( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return state.content[ index ];
		}
	}

	function getSelectedBlockName( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return contentHelpers.getName( state.content[ index ] );
		}
	}

	function getSelectedBlockAttributes( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return contentHelpers.getAttributes( state.content[ index ] );
		}
	}

	function hasPreviousBlock( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return !! state.content[ index - 1 ];
		}

		return false;
	}

	function hasNextBlock( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return !! state.content[ index + 1 ];
		}

		return false;
	}

	function isSelectedBlockEmptySlot( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return (
				contentHelpers.getName( state.content[ index ] ) === 'p' &&
				contentHelpers.isEmpty( state.content[ index ] )
			);
		}
	}

	function isUIShown( state ) {
		return state.showUI;
	}

	function isInserterShown( state ) {
		return state.showInserter;
	}

	function isDragging( state ) {
		return state.dragging;
	}

	function getHoverIndex( state ) {
		return state.hoverIndex;
	}

	/**
	 * Selection path without string index.
	 */
	function getSelectedNodePath( state ) {
		var pointer = state.content;

		return _.filter( state.selection.start, function( index ) {
			var content = pointer && pointer[ index ];

			if ( content ) {
				pointer = contentHelpers.getChildren( content )
				return content;
			}
		} );
	}

	/**
	 * Internal. Maps state to real DOM.
	 */

	function getSelectedBlockNode( state, rootNode ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return rootNode.childNodes[ index ] || rootNode.firstChild;
		}

		return rootNode.firstChild;
	}

	function getSelectedBlockNodes( state, rootNode ) {
		var indices = getSelectedBlockIndices( state );
		var blocks = [];

		indices.forEach( function( index ) {
			var node = rootNode.childNodes[ index ];

			if ( node ) {
				blocks.push( node );
			}
		} );

		return blocks;
	}

	return {
		getSelectedBlockIndex: getSelectedBlockIndex,
		getSelectedBlockIndices: getSelectedBlockIndices,
		getSelectedBlockContent: getSelectedBlockContent,
		hasPreviousBlock: hasPreviousBlock,
		hasNextBlock: hasNextBlock,
		isSelectedBlockEmptySlot: isSelectedBlockEmptySlot,
		isUIShown: isUIShown,
		isInserterShown: isInserterShown,
		isDragging: isDragging,
		getHoverIndex: getHoverIndex,
		getSelectedNodePath: getSelectedNodePath,
		getSelectedBlockName: getSelectedBlockName,
		getSelectedBlockAttributes: getSelectedBlockAttributes,

		_getSelectedBlockNode: getSelectedBlockNode,
		_getSelectedBlockNodes: getSelectedBlockNodes
	};
} )( window.wp.contentHelpers );
