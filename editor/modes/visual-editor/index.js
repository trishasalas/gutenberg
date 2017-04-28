/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from 'components/inserter';
import VisualEditorBlock from './block';

function VisualEditor( { blocks, blockOrder } ) {
	return (
		<div className="editor-visual-editor">
			<div className="editor-visual-editor__blocks">
				{ map( blocks, ( block, uid ) => (
					<VisualEditorBlock
						key={ uid }
						uid={ uid }
						order={ blockOrder.indexOf( uid ) } />
				) ) }
			</div>
			<Inserter />
		</div>
	);
}

export default connect( ( state ) => ( {
	blocks: state.blocks.byUid,
	blockOrder: state.blocks.order
} ) )( VisualEditor );
