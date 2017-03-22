window.wp = window.wp || {};
window.wp.DOMHelpers = ( function( contentHelpers ) {

	function DOMToJSON( node, inner ) {
		var name = node.nodeName.toLowerCase();

		// _.defaults( settings, {
		// 	inner: false,
		// 	path: false
		// } );

		if ( name === '#text' ) {
			return node.nodeValue;
		} else {
			var json = [];
			var jsonAttributes = {};
			var attributes = node.attributes;
			var attributesLength = attributes.length;
			var childNodes = node.childNodes;
			var childNodesLength = childNodes.length;
			var i;

			if ( ! inner ) {
				json.push( name );

				if ( attributesLength ) {
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
							jsonAttributes[ attributes[ i ].name ] = attributes[ i ].value;
						}
					}

					if ( ! _.isEmpty( jsonAttributes ) ) {
						json.push( jsonAttributes );
					}
				}
			}

			if ( childNodesLength ) {
				// Just a BR means it's empty.
				if ( childNodesLength !== 1 || childNodes[ 0 ].nodeName !== 'BR' ) {
					var child;

					for ( i = 0; i < childNodesLength; i++ ) {
						child = DOMToJSON( childNodes[ i ] );

						if ( child ) {
							json.push( child );
						}
					}
				}
			}

			return json;
		}
	}

	function isBlock( name ) {
		return _.indexOf( [
			'div', 'p', 'blockquote', 'figure', 'figcaption', 'footer', 'td'
		], name ) !== -1;
	}

	function isSVGElement( name ) {
		return _.indexOf( [
			'svg', 'use'
		], name ) !== -1;
	}

	function JSONToDOM( json ) {
		if ( ! json.length ) {
			return;
		}

		if ( contentHelpers.isText( json ) ) {
			return document.createTextNode( json.replace( '\u0086', '' ) );
		}

		if ( _.isString( json[ 0 ] ) ) {
			var name = json[ 0 ];

			// Temporary fix for namespace issue.
			if ( name === 'svg' ) {
				var temp = document.createElement( 'div' );

				temp.innerHTML = stateToHTML( [ json ] );

				return temp.firstChild;
			} else {
				var node = document.createElement( name.toUpperCase() );
			}

			var attributes = {};
			var children;

			if ( _.isPlainObject( json[ 1 ] ) ) {
				attributes = json[ 1 ];
				children = _.drop( json, 2 );
			} else {
				children = _.drop( json );
			}

			_.forOwn( attributes, function( value, key ) {
				node.setAttribute( key, value );
			} );

			if ( children.length ) {
				_.forEach( children, function( child ) {
					node.appendChild( JSONToDOM( child ) );
				} );
			} else if ( isBlock( json[ 0 ] ) ) {
				node.appendChild( document.createElement( 'BR' ) );
			}

			return node;
		}

		var node = document.createDocumentFragment();

		_.forEach( json, function( child ) {
			node.appendChild( JSONToDOM( child ) );
		} );

		return node;
	}

	function stateToHTML( content, _recusive ) {
		var string = '';

		_.forEach( content, function( child, index ) {
			if ( contentHelpers.isText( child ) ) {
				string += child.replace( '\u0086', '' );
			} else {
				var id = contentHelpers.getAttribute( child, 'data-wp-block-type' );
				var name = contentHelpers.getName( child );
				var attributes = contentHelpers.getAttributes( child );
				var children = contentHelpers.getChildren( child );

				if ( id ) {
					string += '<!-- ' + id + ' -->';
				}

				string += '<' + name;

				_.forOwn( attributes, function( value, key ) {
					if ( key !== 'data-wp-block-type' ) {
						string += ' ' + key + '="' + value + '"';
					}
				} );

				string += '>';

				string += stateToHTML( children, true );

				string += '</' + name + '>';

				if ( id ) {
					string += '<!-- /wp -->';
				}

				if ( ! _recusive && index < content.length ) {
					string += '\n';
				}
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

	function insertMarkerAtPath( state, path, marker ) {
		var index = _.first( path );

		if ( contentHelpers.isText( state ) ) {
			return state.slice( 0, index ) + marker + state.slice( index );
		}

		return contentHelpers.setChildren( state,
			_.map( contentHelpers.getChildren( state ), function( child, i ) {
				if ( i === index ) {
					return insertMarkerAtPath( child, _.drop( path ), marker );
				}

				return child;
			} )
		);
	}

	function getPathAtMarker( state, marker ) {
		if ( contentHelpers.isText( state ) ) {
			var index = state.indexOf( marker );
			return index === -1 ? false : [ index ];
		} else {
			if ( contentHelpers.isElement( state ) ) {
				state = contentHelpers.getChildren( state );
			}

			var i = state.length;
			var path;

			while ( i-- ) {
				path = getPathAtMarker( state[ i ], marker );

				if ( path ) {
					return [ i ].concat( path );
				}
			}

			return false;
		}
	}

	return {
		DOMToJSON: DOMToJSON,
		JSONToDOM: JSONToDOM,
		stateToHTML: stateToHTML,
		getChildIndex: getChildIndex,
		findNodeWithPath: findNodeWithPath,
		createSelectionPath: createSelectionPath,
		getParentBlock: getParentBlock,
		getEditableRoot: getEditableRoot,
		insertMarkerAtPath: insertMarkerAtPath,
		getPathAtMarker: getPathAtMarker
	};

} )( window.wp.contentHelpers );
