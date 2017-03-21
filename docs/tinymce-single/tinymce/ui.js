( function( tinymce, wp, _, stateSelectors, DOMHelpers, observeStore ) {
	tinymce.PluginManager.add( 'wp:blocks:ui', function( editor ) {
		var editorPadding = 50;

		function getSelectedBlock() {
			return stateSelectors._getSelectedBlockNode( store.getState(), editor.getBody() );
		}

		function getSelectedBlocks() {
			return stateSelectors._getSelectedBlockNodes( store.getState(), editor.getBody() );
		}

		function getSelectedBlockSettings() {
			var content = stateSelectors.getSelectedBlockContent( store.getState() );

			if ( ! content ) {
				return;
			}

			var id = content.attributes && content.attributes[ 'data-wp-block-type' ];
			var settings = wp.blocks.getBlockSettings( id );

			if ( ! id || ! settings ) {
				settings = wp.blocks.getBlockSettingsByTag( content.name );
			}

			return settings;
		}

		function focusToolbar( toolbar ) {
			var node = toolbar.find( 'toolbar' )[0];
			node && node.focus( true );
		}

		_.forEach( wp.blocks.getControls(), function( control, name ) {
			var settings = {
				icon: control.icon
			};

			if ( control.onClick ) {
				settings.onClick = function() {
					control.onClick( getSelectedBlock() );
					editor.nodeChanged();
				};
			}

			if ( control.isActive ) {
				settings.onPostRender = function() {
					var button = this;

					observeStore( store, [
						stateSelectors.getSelectedBlockName,
						stateSelectors.getSelectedBlockAttributes
					], function( tag, attributes ) {
						var settings = getSelectedBlockSettings();

						// Check if block has this control.
						if ( settings && _.includes( settings.controls, name ) ) {
							button.active( control.isActive( tag, attributes ) );
						}
					} );
				};
			}

			editor.addButton( name, settings );
		} );

		var textBlocks = wp.blocks.getType( 'text' );

		editor.addButton( 'text-switcher', {
			type: 'svglistbox',
			icon: 'gridicons-paragraph',
			values: textBlocks.map( function( settings ) {
				return {
					text: settings.displayName,
					icon: settings.icon,
					value: settings._id
				}
			} ),
			onPostRender: function() {
				var button = this;

				observeStore( store, [
					stateSelectors.getSelectedBlockName,
					stateSelectors.getSelectedBlockAttributes
				], function( index ) {
					var settings = getSelectedBlockSettings();

					if ( settings ) {
						button.value( settings._id );
						button.icon( settings.icon );
						button.text( settings.displayName );
					}
				} );
			},
			onClick: function( event ) {
				if ( event.control && event.control.settings.value ) {
					var block = getSelectedBlock();
					var currentSettings = wp.blocks.getBlockSettingsByElement( block );
					var nextSettings = wp.blocks.getBlockSettings( event.control.settings.value );

					// editor.focus();
					editor.selection.collapse();

					var state = store.getState();
					var oldContent = stateSelectors.getSelectedBlockContent( state );

					DOMHelpers.insertMarkerAtPath(
						oldContent, _.drop( state.selection.start ), '\u0086'
					);

					var newContent = currentSettings.toBaseState( oldContent );

					newContent = nextSettings.fromBaseState(
						Array.isArray( newContent ) ? newContent[ 0 ] : newContent
					);

					var oldNode = stateSelectors._getSelectedBlockNode( state, editor.getBody() )
					var newNode = DOMHelpers.stateToDOM( newContent );
					var newPath = DOMHelpers.getPathAtMarker( newContent, '\u0086' );
					var node = DOMHelpers.findNodeWithPath( newPath, newNode );

					oldNode.parentNode.replaceChild( newNode, oldNode );

					editor.selection.setCursorLocation( node, newPath[ newPath.length - 1 ] );
				}
			}
		} );

		editor.on( 'pastePreProcess', function( event ) {
			var block = getSelectedBlock();
			var settings = wp.blocks.getBlockSettingsByElement( block );

			if ( settings.onPaste ) {
				settings.onPaste( event, block )
			}
		} );

		editor.on( 'click', function( event ) {
			var block = getSelectedBlock();
			var settings = wp.blocks.getBlockSettingsByElement( block );

			if ( settings.onClick ) {
				settings.onClick( event, block, function() { editor.nodeChanged() } )
			}
		} );

		editor.on( 'setContent', function( event ) {
			$blocks = editor.$( editor.getBody() ).children();
			$blocks.each( function( i, block ) {
				var settings = wp.blocks.getBlockSettingsByElement( block );

				if ( ! settings ) {
					return;
				}

				if ( settings.editable && settings.editable.length ) {
					editor.$( block ).attr( 'contenteditable', 'false' );

					settings.editable.forEach( function( selector ) {
						if ( ! selector ) {
							editor.$( block ).attr( 'contenteditable', null );
						} else {
							editor.$( block ).find( selector ).attr( 'contenteditable', 'true' );
						}
					} );
				} else {
					editor.$( block ).attr( 'contenteditable', 'false' );
				}
			} );
		} );

		function setFields() {
			var block = getSelectedBlock();
			var settings = wp.blocks.getBlockSettingsByElement( block );

			if ( settings ) {
				if ( settings.editable && settings.editable.length ) {
					settings.editable.forEach( function( selector ) {
						editor.$( block ).find( selector ).attr( 'contenteditable', 'true' );
					} );
				}

				if ( settings.placeholders ) {
					for ( var selector in settings.placeholders ) {
						( selector ? editor.$( block ).find( selector ) : editor.$( block ) )
							.each( function( i, node ) {
								if ( ! node.textContent ) {
									editor.$( node ).attr( 'data-wp-placeholder', settings.placeholders[ selector ] );
								} else {
									editor.$( node ).attr( 'data-wp-placeholder', null );
								}
							} );
					}
				}
			}
		}

		function toInlineContent( content ) {
			var settings = {
				valid_elements: 'strong,em,del,a[href]'
			};

			var schema = new tinymce.html.Schema( settings );
			var parser = new tinymce.html.DomParser( settings, schema );
			var serializer = new tinymce.html.Serializer( settings, schema );

			return serializer.serialize( parser.parse( content, { forced_root_block: false } ) )
		}

		editor.on( 'beforeSetContent', function( event ) {
			if ( event.initial ) {
				return;
			}

			var block = getSelectedBlock();
			var settings = wp.blocks.getBlockSettingsByElement( block );

			if ( settings && settings.editable && settings.editable.length ) {
				settings.editable.forEach( function( selector ) {
					var node = editor.selection.getNode();

					if ( ! selector ) {
						return;
					}

					if ( editor.$( node ).is( selector ) || editor.$( node ).parents( selector ).length ) {
						event.content = toInlineContent( event.content );
					}
				} );
			}
		} );

		editor.on( 'keydown', function( event ) {
			if ( event.keyCode !== tinymce.util.VK.ENTER ) {
				return;
			}

			var block = getSelectedBlock();
			var settings = wp.blocks.getBlockSettingsByElement( block );

			if ( settings && settings.editable && settings.editable.length ) {
				settings.editable.forEach( function( selector ) {
					var node = editor.selection.getNode();

					if ( ! selector ) {
						return;
					}

					if ( editor.$( node ).is( selector ) || editor.$( node ).parents( selector ).length ) {
						event.preventDefault();
					}
				} );
			}
		} );

		editor.on( 'newBlock', function( event ) {
			editor.$( event.newBlock )
				.attr( 'data-wp-placeholder', null )
				.attr( 'data-wp-block-selected', null );
		} );

		// Attach block UI.

		editor.on( 'preinit', function() {
			var DOM = tinymce.DOM;
			var hoverTarget;
			var dragTarget;

			editor.serializer.addTempAttr( 'data-wp-block-selected' );
			editor.serializer.addTempAttr( 'data-wp-placeholder' );

			observeStore( store, [
				stateSelectors.getSelectedBlockIndex,
				stateSelectors.getSelectedBlockName,
				stateSelectors.getSelectedBlockAttributes
			], function( index ) {
				var $prevSelected = editor.$( '*[data-wp-block-selected]' );
				var selected = getSelectedBlock();

				if ( $prevSelected.length ) {
					var prevSettings = wp.blocks.getBlockSettingsByElement( $prevSelected[ 0 ] );

					if ( prevSettings && prevSettings.onDeselect ) {
						prevSettings.onDeselect( $prevSelected[ 0 ] );
					}
				}

				if ( selected ) {
					var settings = wp.blocks.getBlockSettingsByElement( selected );

					if ( settings && settings.onSelect ) {
						settings.onSelect( selected );
					}
				}

				$prevSelected.attr( 'data-wp-block-selected', null );
				editor.$( selected ).attr( 'data-wp-block-selected', 'true' );
			} );

			function removeBlock() {
				var $blocks = editor.$( getSelectedBlock() );
				var p = editor.$( '<p><br></p>' );

				editor.undoManager.transact( function() {
					$blocks.first().before( p );
					editor.selection.setCursorLocation( p[0], 0 );
					$blocks.remove();
				} );
			}

			function moveBlockUp() {
				$blocks = editor.$( getSelectedBlocks() );
				$first = $blocks.first();
				$last = $blocks.last();
				$prev = $first.prev();

				rect = $first[0].getBoundingClientRect();

				if ( $prev.length ) {
					editor.undoManager.transact( function() {
						$last.after( $prev );
					} );

					editor.nodeChanged( { _WPBlockMoved: true } );
					window.scrollBy( 0, - rect.top + $first[0].getBoundingClientRect().top );
				}
			}

			function moveBlockDown() {
				$blocks = editor.$( getSelectedBlocks() );
				$first = $blocks.first();
				$last = $blocks.last();
				$next = $last.next();

				rect = $first[0].getBoundingClientRect();

				if ( $next.length ) {
					editor.undoManager.transact( function() {
						$first.before( $next );
					} );

					editor.nodeChanged( { _WPBlockMoved: true } );
					window.scrollBy( 0, - rect.top + $first[0].getBoundingClientRect().top );
				}
			}

			editor.addButton( 'up', {
				icon: 'gridicons-chevron-up',
				tooltip: 'Up',
				onClick: moveBlockUp,
				classes: 'widget btn move-up',
				onPostRender: function() {
					var button = this;

					store.subscribe( function() {
						button.disabled( ! stateSelectors.hasPreviousBlock( store.getState() ) );
					} );
				}
			} );

			editor.addButton( 'down', {
				icon: 'gridicons-chevron-down',
				tooltip: 'Down',
				onClick: moveBlockDown,
				classes: 'widget btn move-down',
				onPostRender: function() {
					var button = this;

					store.subscribe( function() {
						button.disabled( ! stateSelectors.hasNextBlock( store.getState() ) );
					} );
				}
			} );

			var insert = false;

			editor.addButton( 'add', {
				icon: 'gridicons-add-outline',
				tooltip: 'Add Block',
				onClick: function() {
					// var isEmpty = wp.stateSelectors.isSelectedBlockEmptySlot( store.getState() );

					// if ( ! isEmpty ) {
					// 	var $blocks = editor.$( getSelectedBlock() );
					// 	var $p = editor.$( '<p><br></p>' );

					// 	editor.undoManager.transact( function() {
					// 		$blocks.last().after( $p );
					// 		editor.selection.setCursorLocation( $p[0], 0 );
					// 	} );
					// }

					store.dispatch( {
						type: 'SHOW_INSERTER',
						show: true
					} );
				}
			} );

			// Adjust icon of TinyMCE core buttons.
			editor.buttons.bold.icon = 'gridicons-bold';
			editor.buttons.italic.icon = 'gridicons-italic';
			editor.buttons.strikethrough.icon = 'gridicons-strikethrough';
			// editor.buttons.link.icon = 'gridicons-link';

			var blockToolbarWidth = 0;

			function createBlockOutline( hover ) {
				var outline = document.createElement( 'div' );
				var handleLeft = document.createElement( 'div' );
				var handleRight = document.createElement( 'div' );

				if ( hover ) {
					outline.className = 'block-outline block-outline-hover';
				} else {
					outline.className = 'block-outline';
				}

				handleLeft.className = 'block-outline-handle block-outline-handle-right';
				handleRight.className = 'block-outline-handle block-outline-handle-left';
				outline.appendChild( handleLeft );
				outline.appendChild( handleRight );
				document.body.appendChild( outline );

				DOM.bind( outline, 'mousedown', function( event ) {
					var newEvent = Object.assign( {}, event );

					if ( hover ) {
						dragTarget = hoverTarget;
					} else {
						dragTarget = getSelectedBlock();
					}

					dragTarget.setAttribute( 'contenteditable', 'false' );

					newEvent.target = dragTarget;

					editor.fire( 'mousedown', newEvent );
				} );

				return outline;
			}

			editor.on( 'dragstart', function( event ) {
				// Target not set by us. Abort.
				if ( ! dragTarget ) {
					event.preventDefault();
					return;
				}

				store.dispatch( {
					type: 'DRAGGING',
					dragging: true
				} );

				store.dispatch( { type: 'HIDE_UI' } );

				dragTarget.setAttribute( 'data-wp-block-dragging', 'true' );

				DOM.bind( editor.getDoc(), 'mouseup', end );

				function end( event ) {
					DOM.unbind( editor.getDoc(), 'mouseup', end );

					setTimeout( function() {
						var $draggedNode = editor.$( '*[data-wp-block-dragging]' );

						if ( $draggedNode.length ) {
							$draggedNode[0].removeAttribute( 'data-wp-block-dragging' );

							var settings = wp.blocks.getBlockSettingsByElement( $draggedNode[0] );

							if ( settings && settings.editable && settings.editable.length ) {
								settings.editable.forEach( function( selector ) {
									if ( ! selector ) {
										editor.$( getSelectedBlock() ).attr( 'contenteditable', null );
									}
								} );
							}

							dragTarget = null;

							store.dispatch( {
								type: 'DRAGGING',
								dragging: false
							} );

							store.dispatch( { type: 'SHOW_UI' } );

							editor.nodeChanged( { _WPBlockMoved: true } );
						}
					} );
				}
			} );

			function createInsertToolbar() {
				var insert = editor.wp._createToolbar( [ 'add' ] );

				insert.$el.addClass( 'block-toolbar' );
				insert.$el.addClass( 'insert-toolbar' );

				observeStore( store, [
					stateSelectors.isSelectedBlockEmptySlot
				], function( isEmptySlot ) {
					if ( isEmptySlot ) {
						insert.reposition( getSelectedBlock(), { isEmpty: true } );
					} else {
						insert.hide();
					}
				} );

				insert.reposition = function ( block, settings ) {
					settings = settings || {};

					var toolbar = this.getEl();
					var isFullBleed = editor.$( block ).hasClass( 'alignfull' );
					var toolbarRect = toolbar.getBoundingClientRect();
					var blockRect = block.getBoundingClientRect();
					var contentRect = editor.getBody().getBoundingClientRect();

					if ( settings.isEmpty ) {
						DOM.setStyles( toolbar, {
							position: 'absolute',
							left: contentRect.left + 'px',
							top: blockRect.top + 3 + window.pageYOffset + 'px'
						} );
					} else {
						if ( isFullBleed ) {
							var left = contentRect.left;
						} else {
							var left = blockRect.left - 6;
						}

						DOM.setStyles( toolbar, {
							position: 'absolute',
							left: left + 'px',
							top: blockRect.bottom - 3 + window.pageYOffset + 'px'
						} );
					}

					this.show();
				}

				return insert;
			}

			tinymce.ui.Factory.add( 'WPInsertSeparator', tinymce.ui.Control.extend( {
				renderHtml: function() {
					return (
						'<div id="' + this._id + '" class="insert-separator">' + this.settings.text + '</div>'
					);
				}
			} ) );

			function createInsertMenu() {
				var insertMenu = editor.wp._createToolbar( ( function() {
					var allSettings = wp.blocks.getBlocks();
					var buttons = [];
					var key;
					var types = [ 'text', 'media', 'data visualisation', 'separator' ];

					function onClick( callback, settings ) {
						return function() {
							block = getSelectedBlock()

							var content = callback.apply( this, arguments );
							var args = {
									format: 'html',
									set: true,
									selection: true,
									content: content
								};

							if ( content ) {
								editor.fire( 'beforeSetContent', args );

								if ( typeof content === 'string' ) {
									var temp = document.createElement( 'div' );
									temp.innerHTML = content;
									content = temp.firstChild;
									temp = null;
								} else {
									content = DOMHelpers.stateToDOM( content );
								}

								block.parentNode.replaceChild( content, block );

								if ( ! settings.elements ) {
									content.setAttribute( 'data-wp-block-type', settings._id );
								}

								editor.fire( 'setContent', args );
							}

							window.wp.blocks.selectBlock( content );
						}
					}

					types.forEach( function( type ) {
						buttons.push( {
							type: 'WPInsertSeparator',
							text: type
						} );

						for ( key in allSettings ) {
							if ( allSettings[ key ].type === type ) {
								buttons.push( {
									text: allSettings[ key ].displayName,
									icon: allSettings[ key ].icon,
									onClick: onClick( allSettings[ key ].insert, allSettings[ key ] )
								} );
							}
						}
					} );

					return buttons;
				} )() );

				insertMenu.$el.addClass( 'insert-menu' );

				insertMenu.reposition = function( block ) {
					var toolbar = this.getEl();
					var toolbarRect = toolbar.getBoundingClientRect();
					var elementRect = block.getBoundingClientRect();
					var contentRect = editor.getBody().getBoundingClientRect();

					DOM.setStyles( toolbar, {
						position: 'absolute',
						left: contentRect.left + editorPadding + 'px',
						top: elementRect.top + window.pageYOffset + 'px'
					} );

					this.show();
				}

				observeStore( store, [
					stateSelectors.isInserterShown
				], function( shown ) {
					if ( shown ) {
						insertMenu.reposition( getSelectedBlock() );
					} else {
						insertMenu.hide();
					}
				} );

				return insertMenu;
			}

			function createInlineToolbar() {
				var inline = editor.wp._createToolbar( [ 'bold', 'italic', 'strikethrough' ] );

				inline.reposition = function( editableRoot, field ) {
					this.show();

					var toolbar = this.getEl();
					var toolbarRect = toolbar.getBoundingClientRect();
					var elementRect = editableRoot.getBoundingClientRect();
					var contentRect = editor.getBody().getBoundingClientRect();
					var offset = field ? 0 : blockToolbarWidth;

					DOM.setStyles( toolbar, {
						position: 'absolute',
						left: Math.max( contentRect.left + editorPadding, elementRect.left ) + offset + 'px',
						top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
					} );
				}

				observeStore( store, [
					stateSelectors.isUIShown,
					stateSelectors.getSelectedBlockIndex,
					stateSelectors.getSelectedNodePath,
					stateSelectors.getSelectedBlockName,
					stateSelectors.getSelectedBlockAttributes
				], function( shown, index ) {
					var state = store.getState();
					var settings = getSelectedBlockSettings();

					if ( shown && index !== -1 && ! stateSelectors.isSelectedBlockEmptySlot( state ) &&
						settings && settings.editable && settings.editable.length ) {
						var selection = window.getSelection();

						if ( ! selection.anchorNode ) {
							inline.hide();
							return;
						}

						var editableRoot = DOMHelpers.getEditableRoot( selection.anchorNode );

						// console.log(settings.editable, selection.anchorNode, editableRoot)

						settings.editable.forEach( function( selector ) {
							if ( selector ) {
								if ( editor.$( editableRoot ).is( selector ) ) {
									inline.reposition( editableRoot, true );
									return;
								} else {
									inline.hide();
								}
							} else {
								inline.reposition( getSelectedBlock() );
							}
						} );
					} else {
						inline.hide();
					}
				} );

				return inline;
			}

			function createBlockNavigation() {
				var navigation = editor.wp._createToolbar( [ 'up', 'down' ] );
				var previousIndex;

				navigation.$el.addClass( 'block-toolbar' );

				observeStore( store, [
					stateSelectors.isUIShown,
					stateSelectors.getSelectedBlockIndex,
					stateSelectors.getSelectedBlockContent
				], function( shown, index ) {
					if ( shown && index !== -1 ) {
						navigation.reposition( getSelectedBlock() );
					} else {
						navigation.hide();
					}
				} );

				navigation.reposition = function( block ) {
					var toolbar = this.getEl();
					var isRightAligned = editor.$( block ).hasClass( 'alignright' );
					var isFullBleed = editor.$( block ).hasClass( 'alignfull' );
					var toolbarRect = toolbar.getBoundingClientRect();
					var blockRect = block.getBoundingClientRect();
					var contentRect = editor.getBody().getBoundingClientRect();

					if ( isRightAligned ) {
						var left = contentRect.right - toolbarRect.width;
					} else {
						var left = contentRect.left;
					}

					if ( isFullBleed ) {
						var top = blockRect.top - toolbarRect.height - 10;
					} else {
						var top = blockRect.top;
					}

					DOM.setStyles( toolbar, {
						position: 'absolute',
						left: left + 'px',
						top: top + window.pageYOffset + 'px'
					} );

					this.show();
				}

				return navigation;
			}

			function createBlockToolbars() {
				var settings = wp.blocks.getBlocks();
				var toolbars = {};
				var key;

				for ( key in settings ) {
					toolbars[ key ] = editor.wp._createToolbar( settings[ key ].controls || [] );
					toolbars[ key ].reposition = function( block ) {
						var toolbar = this.getEl();
						var toolbarRect = toolbar.getBoundingClientRect();
						var elementRect = block.getBoundingClientRect();
						var contentRect = editor.getBody().getBoundingClientRect();

						DOM.setStyles( toolbar, {
							position: 'absolute',
							left: Math.max( contentRect.left + editorPadding, elementRect.left ) + 'px',
							top: elementRect.top + window.pageYOffset - toolbarRect.height - 8 + 'px'
						} );

						blockToolbarWidth = toolbarRect.width;

						this.show();
					}
				}

				observeStore( store, [
					stateSelectors.isUIShown,
					stateSelectors.getSelectedBlockIndex,
					stateSelectors.getSelectedBlockContent
				], function( shown, index ) {
					if ( shown && index !== -1 ) {
						var settings = getSelectedBlockSettings();

						tinymce.each( toolbars, function( toolbar, key ) {
							if ( key !== settings._id ) {
								toolbar.hide();
							}
						} );

						toolbars[ settings._id ].reposition( getSelectedBlock() );
					} else {
						tinymce.each( toolbars, function( toolbar ) {
							toolbar.hide();
						} );
					}
				} );

				return toolbars;
			}

			var UI = {
				outline: createBlockOutline(),
				hoverOutline: createBlockOutline( true ),
				insert: createInsertToolbar(),
				insertMenu: createInsertMenu(),
				navigation: createBlockNavigation(),
				blocks: createBlockToolbars(),
				inline: createInlineToolbar()
			};

			observeStore( store, [
				stateSelectors.getHoverIndex,
				stateSelectors.getSelectedBlockIndex
			], function( index, selectedIndex ) {
				if ( index === -1 || index === selectedIndex ) {
					DOM.setStyles( UI.hoverOutline, { display: 'none' } );
				} else {
					var node = editor.getBody().childNodes[ index ];

					if ( ! node ) {
						return;
					}

					var rect = node.getBoundingClientRect()

					DOM.setStyles( UI.hoverOutline, {
						display: 'block',
						position: 'absolute',
						left: rect.left + 'px',
						top: rect.top + window.pageYOffset + 'px',
						height: rect.height + 'px',
						width: rect.width + 'px'
					} );

					hoverTarget = node;
				}
			} );

			observeStore( store, [
				stateSelectors.isUIShown,
				stateSelectors.getSelectedBlockIndices,
				stateSelectors.getSelectedBlockContent
			], function( shown ) {
				var nodes = getSelectedBlocks();

				if ( shown && nodes.length ) {
					var startRect = nodes[0].getBoundingClientRect();
					var endRect = nodes[ nodes.length - 1 ].getBoundingClientRect();

					DOM.setStyles( UI.outline, {
						display: 'block',
						position: 'absolute',
						left: Math.min( startRect.left, endRect.left ) + 'px',
						top: startRect.top + window.pageYOffset + 'px',
						height: endRect.bottom - startRect.top + 'px',
						width: Math.max( startRect.width, endRect.width ) + 'px'
					} );
				} else {
					DOM.setStyles( UI.outline, {
						display: 'none'
					} );
				}
			} );

			// function showBlockUI( focus ) {
			// 	if ( selectedBlocks.length === 1 ) {
			// 		focus && focusToolbar( UI.blocks[ settings._id ] );
			// 	}
			// }

			editor.on( 'selectionChange nodeChange', function( event ) {
				setFields();
			} );

			var metaCount = 0;

			editor.on( 'keydown', function( event ) {
				var keyCode = event.keyCode;
				var VK = tinymce.util.VK;

				if ( keyCode === VK.BACKSPACE ) {
					var rng = editor.selection.getRng();
					var startNode = editor.selection.getStart();
					var endNode = editor.selection.getEnd();
					var editableRoot = DOMHelpers.getEditableRoot( editor.selection.getNode(), editor.getBody() );

					if ( editableRoot ) {
						if ( editor.dom.isEmpty( editableRoot ) ) {
							event.preventDefault();
						}
					}

					console.log( store.getState().selection)

					// Handle tripple click
					// Some browsers select start of the next block.
					if ( false &&
						// It's a selection.
						! rng.isCollapsed &&
						// Cursor is at start of node.
						rng.startOffset === 0 &&
						// Cursor is at start of parent.
						( startNode === rng.startContainer || startNode.firstChild === rng.startContainer ) &&
						// Cursor is at end of parent.
						(
							endNode === rng.endContainer ||
							( startNode.lastChild === rng.startContainer && rng.endOffset === rng.startContainer.data.length ) ||
							( editor.dom.isBlock( rng.endContainer ) && rng.endOffset === 0 )
						)
					) {
						editor.undoManager.transact( function() {
							startNode.innerHTML = '<br>';
							editor.selection.setCursorLocation( startNode, 0 );
						} );

						console.log('adjust');

						event.preventDefault();
					}
				}

				if ( VK.metaKeyPressed( event ) ) {
					metaCount ++;
				} else {
					metaCount = 0;
				}
			}, true );

			editor.on( 'keyup', function( event ) {
				if ( event.keyCode === tinymce.util.VK.BACKSPACE ) {
					var block = getSelectedBlock();

					if ( block.contentEditable === 'false' && editor.dom.isEmpty( block ) ) {
						var p = editor.$( '<p><br></p>' );

						editor.$( block ).before( p );
						editor.selection.setCursorLocation( p[0], 0 );
						editor.$( block ).remove();
					}
				}
			} );

			editor.on( 'keyup', function( event ) {
				if ( metaCount === 1 ) {
					// var selection = window.getSelection();

					// if ( selection.isCollapsed && isEmptySlot( selection.anchorNode, true ) ) {
					// 	return;
					// }

					// UI.insert.reposition();

					// showBlockUI( true );
				}

				metaCount = 0;
			} );
		} );

		if ( window.location.hash === '#debug' ) {
			store.subscribe( function() {
				document.getElementById( 'print' ).textContent =
					DOMHelpers.stateToHTML( store.getState().content );
			} );
		}
	} );
} )(
	window.tinymce,
	window.wp,
	window._,
	window.wp.stateSelectors,
	window.wp.DOMHelpers,
	window.wp.storeHelpers.observeStore
);
