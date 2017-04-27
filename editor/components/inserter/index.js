/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import IconButton from 'components/icon-button';

class Inserter extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.nodes = {};
		this.toggle = this.toggle.bind( this );
		this.close = this.close.bind( this );
		this.state = {
			opened: false
		};
	}

	toggle() {
		if ( this.state.opened === true ) {
			this.nodes.toggle.focus();
		}

		this.setState( {
			opened: ! this.state.opened
		} );
	}

	close() {
		this.setState( {
			opened: false
		} );
	}

	render() {
		const { opened } = this.state;
		const { position } = this.props;

		return (
			<div className="editor-inserter">
				<IconButton
					icon="insert"
					label={ wp.i18n.__( 'Insert block' ) }
					onClick={ this.toggle }
					className="editor-inserter__toggle"
					aria-haspopup="true"
					id="inserter-toggle"
					buttonRef={ ( node ) => this.nodes.toggle = node }
					/>
				{ opened && <InserterMenu position={ position } onSelect={ this.close } closeMenu={ this.toggle } /> }
			</div>
		);
	}
}

export default Inserter;
