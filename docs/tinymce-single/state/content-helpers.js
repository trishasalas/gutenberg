window.wp = window.wp || {};
window.wp.contentHelpers = ( function( _ ) {

	function create() {
		return Array.from( arguments );
	}

	function isText( content ) {
		return _.isString( content );
	}

	function isElement( content ) {
		return _.isArray( content ) && _.isString( content[ 0 ] );
	}

	function getName( content ) {
		if ( isElement( content ) ) {
			return content[ 0 ];
		}
	}

	function setName( content, name ) {
		if ( isElement( content ) ) {
			return _.concat( [ name ], _.tail( content ) )
		}

		return content;
	}

	function hasAttributes( content ) {
		return isElement( content ) && _.isPlainObject( content[ 1 ] ) && ! _.isEmpty( content[ 1 ] );
	}

	function getAttributes( content ) {
		if ( hasAttributes( content ) ) {
			return content[ 1 ];
		}

		return {};
	}

	function getAttribute( content, name ) {
		return getAttributes( content )[ name ];
	}

	function getChildren( content ) {
		if ( isElement( content ) ) {
			if ( _.isPlainObject( content[ 1 ] ) ) {
				return _.drop( content, 2 );
			}

			return _.drop( content );
		}

		return [];
	}

	function getChild( content, index ) {
		return getChildren( content )[ index ];
	}

	function setChildren( content, children ) {
		if ( isElement( content ) ) {
			if ( _.isPlainObject( content[ 1 ] ) ) {
				return _.concat( _.take( content, 2 ), children );
			}

			return _.concat( _.take( content ), children );;
		}

		return content;
	}

	function isEmpty( content ) {
		return getChildren( content ).length === 0;
	}

	return _.extend( create, {
		isText: isText,
		isElement: isElement,
		isEmpty: isEmpty,
		getName: getName,
		setName: setName,
		getAttribute: getAttribute,
		getAttributes: getAttributes,
		getChild: getChild,
		getChildren: getChildren,
		setChildren: setChildren
	} );

} )( window._ );
