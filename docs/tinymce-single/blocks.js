( function( wp ) {
	var _blocks, _controls;

	_blocks = {};
	_controls = {};

	var _elementMap = {};

	wp.blocks = {
		registerBlock: function( settings ) {
			// Note, elements should probably only be registered by core.
			// Maybe for each block, we should offer to extend the settings (add buttons).

			var namespace = settings.namespace;
			var id = namespace + ':' + settings.name;

			_blocks[ id ] = settings;
			_blocks[ id ]._id = id;

			if ( settings.elements ) {
				settings.elements.forEach( function( element ) {
					_elementMap[ element ] = id;
				} );
			}
		},
		getType: function( name ) {
			var settings = [];
			var key;

			for ( key in _blocks ) {
				if ( _blocks[ key ].type === name ) {
					settings.push( _blocks[ key ] );
				}
			}

			return settings;
		},
		registerControl: function( name, settings ) {
			_controls[ name ] = settings;
		},
		getBlockSettings: function( name ) {
			return _blocks[ name ];
		},
		getControlSettings: function( name ) {
			return _controls[ name ];
		},
		getBlockSettingsByTag: function( tag ) {
			return this.getBlockSettings( _elementMap[ tag ] );
		},
		getBlockSettingsByElement: function( element ) {
			var id = element.getAttribute( 'data-wp-block-type' );

			if ( ! id || ! this.getBlockSettings( id ) ) {
				id = _elementMap[ element.nodeName.toLowerCase() ];
			}

			return this.getBlockSettings( id );
		},
		getBlocks: function() {
			return _blocks;
		},
		getControls: function() {
			return _controls;
		},
		extendBlock: function( settings ) {
			var extendId = settings.extends;
			var id = settings.namespace + ':' + settings.name;

			if ( _blocks[ extendId ] ) {
				_blocks[ extendId ].controls.push( '|' );

				_blocks[ extendId ].controls.push( {
					icon: settings.icon,
					text: '1',
					onClick: function( block ) {
						block.removeAttribute( 'data-wp-block-type' );
					},
					isActive: function( block ) {
						return ! block.getAttribute( 'data-wp-block-type' );
					}
				} );

				_blocks[ extendId ].controls.push( {
					icon: settings.icon,
					text: '2',
					onClick: function( block ) {
						block.setAttribute( 'data-wp-block-type', id );
					},
					isActive: function( block ) {
						return block.getAttribute( 'data-wp-block-type' ) === id;
					}
				} );

				_elementMap[ id ] = extendId;
			}
		}
	};
} )( window.wp = window.wp || {} );
