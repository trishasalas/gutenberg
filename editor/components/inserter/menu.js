/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/filter';

/**
 * Internal dependencies
 */
import './style.scss';
import Dashicon from 'components/dashicon';
import { focusNextFocusableRef, focusPreviousFocusableRef, listVisibleBlocksByCategory } from './helpers';

class InserterMenu extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.blockTypes = wp.blocks.getBlocks();
		this.categories = wp.blocks.getCategories();
		this.nodes = {};
		this.state = {
			filterValue: '',
			focusedElementRef: null
		};
		this.filter = this.filter.bind( this );
		this.isShownBlock = this.isShownBlock.bind( this );
		this.changeMenuSelection = this.changeMenuSelection.bind( this );
		this.setSearchFocus = this.setSearchFocus.bind( this );
	}

	componentDidMount() {
		// Set the component menu to have focus in DOM.
		this.menuNode.focus();

		// Build a stream of keydown events on component mount.
		this.keyStream$ = Observable.fromEvent( document, 'keydown' );

		// Out of keydown stream build a stream matching arrow down and arrow right.
		this.focusNextFocusableRef$ = this.keyStream$.filter( keydown => keydown.code === 'ArrowDown' || keydown.code === 'ArrowRight' || ( keydown.code === 'Tab' && keydown.shiftKey === false ) );

		// Out of keydown stream build a stream matching arrow left and arrow up.
		this.focusPreviousFocusableRef$ = this.keyStream$.filter( keydown => keydown.code === 'ArrowUp' || keydown.code === 'ArrowLeft' || ( keydown.code === 'Tab' && keydown.shiftKey === true ) );

		// Get escape key presses.
		this.closeInserter$ = this.keyStream$.filter( keydown => keydown.code === 'Escape' );

		// Create subscriptions for our next and previous blockType focus actions.
		this.nextBlockSubscription = this.focusNextFocusableRef$.subscribe( ( keydown ) => {
			keydown.preventDefault();
			focusNextFocusableRef( this );
		} );
		this.previousBlockSubscription = this.focusPreviousFocusableRef$.subscribe( ( keydown ) => {
			keydown.preventDefault();
			focusPreviousFocusableRef( this );
		} );
		this.closeInserterSubscription = this.closeInserter$.subscribe( () => {
			this.props.closeMenu();
		} );
	}

	componentWillUnmount() {
		// Unsubscribe from the stream.
		this.nextBlockSubscription.unsubscribe();
		this.previousBlockSubscription.unsubscribe();
		this.closeInserterSubscription.unsubscribe();

		// These deletes are most likely not necessary but memory leaks can be pretty ugly.
		delete this.nextBlockSubscription;
		delete this.previousBlockSubscription;
		delete this.closeInserterSubscription;
		delete this.closeInserter$;
		delete this.focusPreviousFocusableRef$;
		delete this.focusNextFocusableRef$;
		delete this.keyStreamSubscription;
		delete this.keyStream$;
	}

	filter( event ) {
		this.setState( {
			filterValue: event.target.value
		} );
	}

	isShownBlock( block ) {
		return block.title.toLowerCase().indexOf( this.state.filterValue.toLowerCase() ) !== -1;
	}

	selectBlock( slug ) {
		return () => {
			this.props.onInsertBlock( slug );
			this.props.onSelect();
			this.setState( {
				filterValue: '',
				focusedElementRef: null
			} );
		};
	}

	changeMenuSelection( refName ) {
		this.setState( {
			focusedElementRef: refName
		} );

		// Focus the DOM node.
		this.nodes[ refName ].focus();
	}

	setSearchFocus() {
		this.changeMenuSelection( 'search' );
	}

	render() {
		const { position = 'top' } = this.props;
		const blocks = this.blockTypes;
		const visibleBlocksByCategory = listVisibleBlocksByCategory( this.state )( blocks );
		const categories = this.categories;

		return (
			<div ref={ ( ref ) => this.menuNode = ref } className={ `editor-inserter__menu is-${ position }` } tabIndex="0">
				<div className="editor-inserter__arrow" />
				<div role="menu" className="editor-inserter__content">
					{ categories
						.map( ( category ) => !! visibleBlocksByCategory[ category.slug ] && (
							<div key={ category.slug }>
								<div className="editor-inserter__separator">{ category.title }</div>
								<div className="editor-inserter__category-blocks">
									{ visibleBlocksByCategory[ category.slug ].map( ( { slug, title, icon } ) => (
										<button
											key={ slug }
											className="editor-inserter__block"
											onClick={ this.selectBlock( slug ) }
											role="menuitem"
											ref={ ( node ) => this.nodes[ slug ] = node }
											tabIndex="-1"
										>
											<Dashicon icon={ icon } />
											{ title }
										</button>
									) ) }
								</div>
							</div>
						) )
					}
				</div>
				<input
					type="search"
					placeholder={ wp.i18n.__( 'Search…' ) }
					className="editor-inserter__search"
					onChange={ this.filter }
					onClick={ this.setSearchFocus }
					ref={ ( node ) => this.nodes.search = node }
				/>
			</div>
		);
	}
}

export default connect(
	undefined,
	( dispatch ) => ( {
		onInsertBlock( slug ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				block: wp.blocks.createBlock( slug )
			} );
		}
	} )
)( InserterMenu );
