const attributes = [ 'id', 'class', 'style' ];

export default function( editor ) {
	editor.on( 'BeforePastePreProcess', ( event ) => {
		if ( event.internal ) {
			return;
		}

		attributes.forEach( attribute => {
			const regExp = new RegExp( '(<[^>]+) ' + attribute + '="[^"]*"([^>]*>)', 'gi' );
			event.content = event.content.replace( regExp, ( match, $1, $2 ) => $1 + $2 );
		} );
	} );
}
