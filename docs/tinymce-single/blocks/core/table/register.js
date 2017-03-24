( function( wp ) {

	function insertEmpty() {
		return (
			[ 'figure',
				[ 'table',
					[ 'tr',
						[ 'td' ],
						[ 'td' ]
					],
					[ 'tr',
						[ 'td' ],
						[ 'td' ]
					]
				],
				[ 'figcaption' ]
			]
		);
	}

	wp.blocks.registerBlock( {
		name: 'table',
		namespace: 'wp',
		displayName: 'Table',
		type: 'data visualisation',
		icon: 'gridicons-grid',
		editable: [ 'table', 'figcaption' ],
		placeholders: {
			figcaption: 'Write caption\u2026'
		},
		insert: insertEmpty,
		controls: [
			'block-align-left',
			'block-align-center',
			'block-align-right',
			'block-align-full',
			// TODO: remove editor dependency.
			{
				classes: 'gridicons-rotate',
				icon: 'gridicons-indent-right',
				onClick: function( element, helpers ) {
					// editor.execCommand( 'mceTableInsertRowBefore' );
				}
			},
			{
				classes: 'gridicons-rotate',
				icon: 'gridicons-indent-left',
				onClick: function( element, helpers ) {
					// editor.execCommand( 'mceTableInsertRowAfter' );
				}
			},
			{
				icon: 'gridicons-indent-right',
				onClick: function( element, helpers ) {
					// editor.execCommand( 'mceTableInsertColBefore' );
				}
			},
			{
				icon: 'gridicons-indent-left',
				onClick: function( element, helpers ) {
					// editor.execCommand( 'mceTableInsertColAfter' );
				}
			},
			{
				icon: 'gridicons-cog',
				onClick: function() {}
			}
		]
	} );

} )( window.wp );
