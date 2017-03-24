window.wp = window.wp || {};
window.wp.stateSelectors = ( function( h ) {

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
			return h.getName( state.content[ index ] );
		}
	}

	function getSelectedBlockAttributes( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return h.getAttributes( state.content[ index ] );
		}
	}

	function hasPreviousBlock( state ) {
		var indices = getSelectedBlockIndices( state );

		if ( indices.length ) {
			return !! state.content[ indices[ 0 ] - 1 ];
		}

		return false;
	}

	function hasNextBlock( state ) {
		var indices = getSelectedBlockIndices( state );

		if ( indices.length ) {
			return !! state.content[ indices[ indices.length - 1 ] + 1 ];
		}

		return false;
	}

	function isSelectedBlockEmptySlot( state ) {
		var index = getSelectedBlockIndex( state );

		if ( index !== -1 ) {
			return (
				h.getName( state.content[ index ] ) === 'p' &&
				h.isEmpty( state.content[ index ] )
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
				pointer = h.getChildren( content )
				return content;
			}
		} );
	}

	function getContent( state, index ) {
		if ( index != null && index !== -1 ) {
			return state.content[ index ];
		}

		return state.content;
	}

	function getContentWithMarkers( state, index ) {
		var content = _insertMarkersAtPath( getContent( state ), state.selection.start, '\u0086' );

		if ( index != null && index !== -1 ) {
			return content[ index ];
		}

		return content;
	}

	function _insertMarkersAtPath( content, path, marker ) {
		var index = _.first( path );

		function map( element, i ) {
			if ( i === index ) {
				return _insertMarkersAtPath( element, _.drop( path ), marker );
			}

			return element;
		}

		if ( h.isText( content ) ) {
			return content.slice( 0, index ) + marker + content.slice( index );
		} else if ( h.isElement( content ) ) {
			return h.setChildren( content, _.map( h.getChildren( content ), map ) );
		}

		return _.map( content, map );
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
		getContent: getContent,
		getContentWithMarkers: getContentWithMarkers
	};
} )( window.wp.contentHelpers );
