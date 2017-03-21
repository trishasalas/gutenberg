window.store = ( function( Redux, _ ) {

	var initialState = {
		content: [],
		selection: {
			start: [ 0 ],
			end: [ 0 ],
			isCollapsed: true
		},
		showUI: false,
		showInserter: false,
		dragging: false,
		hoverIndex: -1
	};

	return Redux.createStore( function( state, action ) {
		window.console.log( action );

		if ( action.type === 'SET_CONTENT' ) {
			state = _.assign( {}, state, {
				content: _.concat( action.content )
			} );
		}

		if ( action.type === 'SET_SELECTION' ) {
			state = _.assign( {}, state, {
				selection: _.assign( {}, action.selection )
			} );
		}

		if ( action.type === 'SET_SELECTED_BLOCK_CONTENT' ) {
			state = _.assign( {}, state, {
				content: _.map( state.content, function( value, i ) {
					if ( i === state.selection.start[ 0 ] ) {
						return action.content;
					} else {
						return value;
					}
				} )
			} );
		}

		if ( action.type === 'SHOW_UI' ) {
			state = _.assign( {}, state, { showUI: true } );
		}

		if ( action.type === 'HIDE_UI' ) {
			state = _.assign( {}, state, { showUI: false } );
		}

		if ( action.type === 'SHOW_INSERTER' ) {
			state = _.assign( {}, state, {
				showInserter: action.show
			} );
		}

		if ( action.type === 'DRAGGING' ) {
			state = _.assign( {}, state, {
				dragging: action.dragging
			} );
		}

		if ( action.type === 'UPDATE_HOVER_INDEX' ) {
			state = _.assign( {}, state, {
				hoverIndex: action.index
			} );
		}

		return state;
	}, initialState );

})( window.Redux, window._ );

window.wp.storeHelpers = ( function( _ ) {

	function observeStore( store, select, onChange ) {
		var currentState = [];

		select = _.castArray( select );

		function handleChange() {
			var nextState = _.map( select, function( callback ) {
				return callback( store.getState() );
			} );

			if ( ! _.isEqual( nextState, currentState ) ) {
				currentState = nextState;
				onChange.apply( null, currentState );
			}
		}

		var unsubscribe = store.subscribe( handleChange );

		handleChange();

		return unsubscribe;
	}

	return {
		observeStore: observeStore
	};

} )( window._ );
