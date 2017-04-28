/**
 * External dependencies
 */
import { Fill } from 'react-slot-fill';

/**
 * Internal dependencies
 */
import { registerBlock, query } from 'api';
import Editable from 'components/editable';
import Inserter from '../../../editor/components/inserter';

const { children } = query;

const DEFAULT_CONTENT = <p />;

registerBlock( 'core/text', {
	title: wp.i18n.__( 'Text' ),

	icon: 'text',

	category: 'common',

	attributes: {
		content: children(),
	},

	defaultAttributes: {
		content: DEFAULT_CONTENT
	},

	controls: [
		{
			icon: 'editor-alignleft',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => ! align || 'left' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: undefined } );
			}
		},
		{
			icon: 'editor-aligncenter',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'center' } );
			}
		},
		{
			icon: 'editor-alignright',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'right' } );
			}
		}
	],

	merge( attributes, attributesToMerge ) {
		return {
			content: wp.element.concatChildren( attributes.content, attributesToMerge.content )
		};
	},

	edit( { attributes, setAttributes, insertBlockAfter, focus, setFocus, mergeWithPrevious } ) {
		const { content, align } = attributes;
		const isEmpty = ( ! content || content === DEFAULT_CONTENT );

		const editable = (
			<Editable
				key="editable"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				style={ align ? { textAlign: align } : null }
				onSplit={ ( before, after ) => {
					setAttributes( { content: before } );

					let afterBlockAttributes;
					if ( after ) {
						afterBlockAttributes = { content: after };
					}

					insertBlockAfter( wp.blocks.createBlock(
						'core/text',
						afterBlockAttributes
					) );
				} }
				onMerge={ mergeWithPrevious }
			/>
		);

		if ( focus && isEmpty ) {
			return [
				<Fill key="inserter" name="Mover">
					<Inserter />
				</Fill>,
				editable
			];
		}

		return editable;
	},

	save( { attributes } ) {
		// An empty block will have an undefined content field. Return early
		// as an empty string.
		const { content } = attributes;
		if ( ! content ) {
			return '';
		}

		// We only need to transform content if we need to apply the alignment
		// style. Otherwise we can return unmodified.
		const { align } = attributes;
		if ( ! align ) {
			return content;
		}

		return wp.element.Children.map( content, ( paragraph ) => (
			wp.element.cloneElement( paragraph, {
				style: { textAlign: align }
			} )
		) );
	}
} );
