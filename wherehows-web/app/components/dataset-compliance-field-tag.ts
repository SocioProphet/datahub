import Component from '@ember/component';
import ComputedProperty from '@ember/object/computed';
import { get, getProperties, computed } from '@ember/object';
import {
  Classification,
  ComplianceFieldIdValue,
  getDefaultSecurityClassification,
  idTypeFieldHasLogicalType,
  isFieldIdType
} from 'wherehows-web/constants';
import {
  IComplianceChangeSet,
  IComplianceFieldFormatOption,
  IDropDownOption
} from 'wherehows-web/typings/app/dataset-compliance';
import { IComplianceDataType } from 'wherehows-web/typings/api/list/compliance-datatypes';
import { action } from 'ember-decorators/object';

/**
 * Constant definition for an unselected field format
 * @type {IDropDownOption<null>}
 */
const unSelectedFieldFormatValue: IDropDownOption<null> = {
  value: null,
  label: 'Select Field Format...',
  isDisabled: true
};

export default class DatasetComplianceFieldTag extends Component {
  tagName = 'tr';

  /**
   * Describes action interface for `onTagIdentifierTypeChange` action
   * @memberof DatasetComplianceFieldTag
   */
  onTagIdentifierTypeChange: (tag: IComplianceChangeSet, option: { value: ComplianceFieldIdValue | null }) => void;

  /**
   * Describes the parent action interface for `onTagLogicalTypeChange`
   */
  onTagLogicalTypeChange: (tag: IComplianceChangeSet, value: IComplianceChangeSet['logicalType']) => void;

  /**
   * Describes the parent action interface for `onTagClassificationChange`
   */
  onTagClassificationChange: (tag: IComplianceChangeSet, option: { value: '' | Classification }) => void;

  /**
   * Describes the parent action interface for `onTagOwnerChange`
   */
  onTagOwnerChange: (tag: IComplianceChangeSet, nonOwner: boolean) => void;

  /**
   * References the change set item / tag to be added to the parent field
   * @type {IComplianceChangeSet}
   * @memberof DatasetComplianceFieldTag
   */
  tag: IComplianceChangeSet;

  /**
   * Reference to the compliance data types
   * @type {Array<IComplianceDataType>}
   */
  complianceDataTypes: Array<IComplianceDataType>;

  /**
   * Flag indicating that this tag has an identifier type of idType that is true
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceFieldTag
   */
  isIdType: ComputedProperty<boolean> = computed('tag.identifierType', 'complianceDataTypes', function(
    this: DatasetComplianceFieldTag
  ): boolean {
    const { tag, complianceDataTypes } = getProperties(this, ['tag', 'complianceDataTypes']);
    return isFieldIdType(complianceDataTypes)(tag);
  });

  /**
   * A list of field formats that are determined based on the tag identifierType
   * @type ComputedProperty<Array<IComplianceFieldFormatOption>>
   * @memberof DatasetComplianceFieldTag
   */
  fieldFormats: ComputedProperty<Array<IComplianceFieldFormatOption>> = computed(
    'isIdType',
    'complianceDataTypes',
    function(this: DatasetComplianceFieldTag): Array<IComplianceFieldFormatOption> {
      const identifierType = get(this, 'tag')['identifierType'] || '';
      const { isIdType, complianceDataTypes } = getProperties(this, ['isIdType', 'complianceDataTypes']);
      const complianceDataType = complianceDataTypes.findBy('id', identifierType);
      let fieldFormatOptions: Array<IComplianceFieldFormatOption> = [];

      if (complianceDataType && isIdType) {
        const supportedFieldFormats = complianceDataType.supportedFieldFormats || [];
        const supportedFormatOptions = supportedFieldFormats.map(format => ({ value: format, label: format }));

        return supportedFormatOptions.length
          ? [unSelectedFieldFormatValue, ...supportedFormatOptions]
          : supportedFormatOptions;
      }

      return fieldFormatOptions;
    }
  );

  /**
   * Checks if the field format / logical type for this tag is missing, if the field is of ID type
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceFieldTag
   */
  isTagFormatMissing = computed('isIdType', 'tag.logicalType', function(this: DatasetComplianceFieldTag): boolean {
    return get(this, 'isIdType') && !idTypeFieldHasLogicalType(get(this, 'tag'));
  });

  /**
   * The tag's security classification
   * Retrieves the tag security classification from the compliance tag if it exists, otherwise
   * defaults to the default security classification for the identifier type
   * in other words, the field must have a security classification if it has an identifier type
   * @type {ComputedProperty<Classification | null>}
   * @memberof DatasetComplianceFieldTag
   */
  tagClassification = computed('tag.classification', 'tag.identifierType', 'complianceDataTypes', function(
    this: DatasetComplianceFieldTag
  ): IComplianceChangeSet['securityClassification'] {
    const { tag: { identifierType, securityClassification }, complianceDataTypes } = getProperties(this, [
      'tag',
      'complianceDataTypes'
    ]);

    return securityClassification || getDefaultSecurityClassification(complianceDataTypes, identifierType);
  });

  /**
   * Flag indicating that this tag has an identifier type that is of pii type
   * @type {ComputedProperty<boolean>}
   * @memberof DatasetComplianceFieldTag
   */
  isPiiType = computed('tag.identifierType', function(this: DatasetComplianceFieldTag): boolean {
    const { identifierType } = get(this, 'tag');
    const isDefinedIdentifierType = identifierType !== null || identifierType !== ComplianceFieldIdValue.None;

    // If identifierType exists, and tag is not idType or None or null
    return !!identifierType && !get(this, 'isIdType') && isDefinedIdentifierType;
  });

  /**
   * Handles UI changes to the tag identifierType
   * @param {{ value: ComplianceFieldIdValue }} { value }
   */
  @action
  tagIdentifierTypeDidChange(this: DatasetComplianceFieldTag, { value }: { value: ComplianceFieldIdValue | null }) {
    const onTagIdentifierTypeChange = get(this, 'onTagIdentifierTypeChange');

    if (typeof onTagIdentifierTypeChange === 'function') {
      onTagIdentifierTypeChange(get(this, 'tag'), { value });
    }
  }

  /**
   * Handles the updates when the tag's logical type changes on this tag
   * @param {(IComplianceChangeSet['logicalType'])} value contains the selected drop-down value
   */
  @action
  tagLogicalTypeDidChange(this: DatasetComplianceFieldTag, { value }: { value: IComplianceChangeSet['logicalType'] }) {
    const onTagLogicalTypeChange = get(this, 'onTagLogicalTypeChange');

    if (typeof onTagLogicalTypeChange === 'function') {
      onTagLogicalTypeChange(get(this, 'tag'), value);
    }
  }

  /**
   * Handles UI change to field security classification
   * @param {({ value: '' | Classification })} { value } contains the changed classification value
   */
  @action
  tagClassificationDidChange(this: DatasetComplianceFieldTag, { value }: { value: '' | Classification }) {
    const onTagClassificationChange = get(this, 'onTagClassificationChange');
    if (typeof onTagClassificationChange === 'function') {
      onTagClassificationChange(get(this, 'tag'), { value });
    }
  }

  /**
   * Handles the nonOwner flag update on the tag
   * @param {boolean} nonOwner
   */
  @action
  tagOwnerDidChange(this: DatasetComplianceFieldTag, nonOwner: boolean) {
    // inverts the value of nonOwner, toggle is shown in the UI as `Owner` i.e. not nonOwner
    get(this, 'onTagOwnerChange')(get(this, 'tag'), !nonOwner);
  }
}