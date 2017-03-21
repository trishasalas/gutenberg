window.wp = window.wp || {};
window.wp.DOMHelpers = ( function() {

	function DOMToState( node, selection ) {
		var state = {
			name: node.nodeName.toLowerCase()
		};

		if ( state.name !== '#text' ) {
			var attributes = node.attributes;
			var attributesLength = attributes.length;
			var childNodes = node.childNodes;
			var childNodesLength = childNodes.length;

			var i;

			if ( attributesLength ) {
				state.attributes = {};

				for ( i = 0; i < attributesLength; i++ ) {
					if ( attributes[ i ].name === 'data-mce-bogus' ) {
						return null;
					}

					if ( [
						'contenteditable',
						'data-mce-selected',
						'data-wp-block-selected',
						'data-wp-placeholder',
						'data-wp-block-dragging'
					].indexOf( attributes[ i ].name ) === -1 &&
					attributes[ i ].name.indexOf( 'data-mce-' ) !== 0 ) {
						state.attributes[ attributes[ i ].name ] = attributes[ i ].value;
					}
				}

				if ( _.isEmpty( state.attributes ) ) {
					delete state.attributes;
				}
			}

			if ( childNodesLength ) {
				// Just a BR means it's empty.
				if ( childNodesLength !== 1 || childNodes[ 0 ].nodeName !== 'BR' ) {
					var child;

					state.children = [];

					for ( i = 0; i < childNodesLength; i++ ) {
						child = DOMToState( childNodes[ i ] );

						if ( child ) {
							state.children.push( child );
						}
					}
				}
			}
		} else {
			state.value = node.nodeValue;
		}

		return state;
	}

	function stateToDOM( state ) {
		if ( Array.isArray( state ) ) {
			node = document.createDocumentFragment();

			state.forEach( function( child ) {
				node.appendChild( stateToDOM( child ) );
			} );
		} else if ( state.name !== '#text' ) {
			var node = document.createElement( state.name.toUpperCase() );

			if ( state.attributes ) {
				var name;

				for ( name in state.attributes ) {
					node.setAttribute( name, state.attributes[ name ] );
				}
			}

			if ( state.children ) {
				state.children.forEach( function( child ) {
					node.appendChild( stateToDOM( child ) );
				} );
			} else {
				node.appendChild( document.createElement( 'BR' ) );
			}
		} else {
			node = document.createTextNode( state.value.replace( '\u0086', '' ) );
		}

		return node;
	}

	function stateToHTML( state, _recusive ) {
		var string = '';

		state.forEach( function( child, i ) {
			var end = '';

			if ( child.name !== '#text' ) {
				if ( child.attributes && child.attributes[ 'data-wp-block-type' ] ) {
					string += '<!-- ' + child.attributes[ 'data-wp-block-type' ] + ' -->';
					end += '<!-- /wp -->';
				}

				string += '<' + child.name;

				if ( child.attributes ) {
					var name;

					for ( name in child.attributes ) {
						if ( name === 'data-wp-block-type' ) {
							break;
						}

						string += ' ' + name + '="' + child.attributes[ name ] + '"';
					}
				}

				string += '>';

				if ( child.children ) {
					string += stateToHTML( child.children, true );
				}

				string += '</' + child.name + '>';

				string += end;

				if ( ! _recusive && i < state.length ) {
					string += '\n';
				}
			} else {
				string += child.value;
			}
		} );

		return string;
	}

	function getChildIndex( child ) {
		var parent = child.parentNode;
		var i = parent.childNodes.length;

		while ( i-- ) {
			if ( child === parent.childNodes[ i ] ) {
				return i;
			}
		}
	}

	function getChildNodeByIndex( index, parentNode ) {
		return rootNode.childNodes[ index ];
	}

	function findNodeWithPath( path, rootNode ) {
		var childNodes = rootNode.childNodes;
		var index = path[ 0 ];

		if ( index != null && childNodes ) {
			var node = childNodes[ index ];

			if ( node.nodeType === 3 ) {
				return node;
			} else if ( node ) {
				path = _.drop( path );

				if ( path.length ) {
					return findNodeWithPath( path, node );
				} else {
					return node;
				}
			}
		}
	}

	function createSelectionPath( range, startNode, endNode, isCollapsed, rootNode ) {
		var start = [];
		var end = [];

		if ( range.startContainer !== rootNode ) {
			start.push( range.startOffset );
		}

		if ( range.endContainer !== rootNode ) {
			end.push( range.endOffset );
		}

		if ( range.startContainer.nodeType === 3 ) {
			startNode = range.startContainer;
		}

		if ( range.endContainer.nodeType === 3 ) {
			endNode = range.endContainer;
		}

		while ( startNode !== rootNode ) {
			start.unshift( getChildIndex( startNode ) )
			startNode = startNode.parentNode;
		}

		while ( endNode !== rootNode ) {
			end.unshift( getChildIndex( endNode ) )
			endNode = endNode.parentNode;
		}

		// Browser selected start (0) of next node. We'll have to correct it.
		if ( ! isCollapsed && end.length > 1 && end[ end.length - 1 ] === 0 ) {
			// Find the first non zero index.
			var i = end.length;

			while ( i-- ) {
				if ( end[ i ] !== 0 ) {
					break;
				}
			}

			// Move one up the tree.
			end[ i ] = end[ i ] - 1;

			// Drop all 0 values.
			end.splice( i + 1 );

			// Fill with contents.

			var node = findNodeWithPath( end, rootNode );

			while ( node.lastChild ) {
				end.push( node.childNodes.length - 1 )
				node = node.lastChild;
			}

			if ( node.nodeType === 3 ) {
				end.push( node.nodeValue.length - 1 )
			}
		}

		return {
			start: start,
			end: end,
			isCollapsed: isCollapsed
		}
	}

	function getParentBlock( node, rootNode ) {
		if ( ! rootNode.contains( node ) ) {
			return;
		}

		if ( node === rootNode ) {
			return;
		}

		while ( node.parentNode !== rootNode ) {
			node = node.parentNode;
		}

		return node;
	}

	function getEditableRoot( node, rootNode ) {
		while ( node !== rootNode ) {
			if ( node.contentEditable === 'true' ) {
				return node;
			}

			node = node.parentNode;
		}
	}

	/**
	 * Mutates state arg!
	 */
	function insertMarkerAtPath( state, path, marker ) {
		var child = state;

		path.forEach( function( index ) {
			if ( child.children && child.children[ index ] ) {
				child = child.children[ index ];
			} else if ( child.name === '#text' ) {
				child.value = child.value.slice( 0, index ) + marker + child.value.slice( index )
			}
		} );
	}

	function getPathAtMarker( state, marker ) {
		if ( state.name === '#text' ) {
			var index = state.value.indexOf( marker );
			return index === -1 ? false : [ index ];
		} else {
			if ( state.children && state.children.length ) {
				var i = state.children.length;
				var path;

				while ( i-- ) {
					path = getPathAtMarker( state.children[ i ], marker );

					if ( path ) {
						return [ i ].concat( path );
					}
				}

				return false;
			} else {
				return false;
			}
		}
	}

	return {
		DOMToState: DOMToState,
		stateToDOM: stateToDOM,
		stateToHTML: stateToHTML,
		getChildIndex: getChildIndex,
		findNodeWithPath: findNodeWithPath,
		createSelectionPath: createSelectionPath,
		getParentBlock: getParentBlock,
		getEditableRoot: getEditableRoot,
		insertMarkerAtPath: insertMarkerAtPath,
		getPathAtMarker: getPathAtMarker
	};

} )();
