import React, { memo, useCallback, useMemo } from 'react';

import cn from 'classnames';
import range from 'lodash/range';
import { FormattedMessage, useIntl } from 'react-intl';
import moment from 'moment';
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

import uuid from 'uuid/v4';

import { MenuItem } from '@material-ui/core';

import { Button, List, ListItem, Tag, TextField, Tooltip, Typography } from '@wld/ui';

import { styles } from './studies_styles';
import translations from './studies_translations';
import { EditDialog } from '../../../../commons/edit_dialog/edit_dialog';
import { useFormikContext } from 'formik';
import { createUseStyles } from 'react-jss';

import { ReactComponent as AddIcon } from '../../../../../assets/icons/add.svg';
import { ReactComponent as MoveIcon } from '../../../../../assets/icons/move_list.svg';
import { ReactComponent as TrashIcon } from '../../../../../assets/icons/trash.svg';
import { Select } from '../../../../commons/select/select';

const DragHandle = SortableHandle(({ classes}) => <MoveIcon className={classes.dragHandle}/>);

const useStyles = createUseStyles(styles);

const SelectComponent =  memo(({value, onChange, classes, id}) => {
    const selectYearItems = useMemo(
        () =>
            range(1980, moment().year() + 8)
                .sort((a, b) => b - a)
                .map(year => (
                    <MenuItem key={`formation_year_${id}_${year}`} value={year}>
                        {year}
                    </MenuItem>
                )),
        []
    );
    return (
    <Select
        variant="outlined"
        value={value?.year()}
        onChange={onChange}
        textFieldIconProps={{ className: classes.selectIcon }}>
        {selectYearItems}
    </Select>
    )
})

const FormationItem = SortableElement(({ id, formation, onChange, onRemove, error: fieldErrors, classes, formationIndex: index }) => {
    const { formatMessage } = useIntl();


    const handleInstitutionChange = useCallback(e => onChange(index, 'institution', e.target.value), [index]);
    const handleStudyType = useCallback(e => onChange(index, 'studyType', e.target.value), [index]);
    const handleAreaChange = useCallback(e => onChange(index, 'area', e.target.value), [index]);
    const handleEndDate = useCallback(value => onChange(index, 'endDate', moment({ year: value })), [index]);

    return (
        <div className={classes.itemContainer}>
            <DragHandle {...{ classes }} />
            <ListItem className={cn(classes.listItem, fieldErrors && classes.listItemError)}>
                <div>
                    <div className={classes.fieldGroup}>
                        <div className={classes.field}>
                            <TextField
                                value={formation.institution}
                                onChange={handleInstitutionChange}
                                id={`formation_institution_${id}`}
                                placeholder={formatMessage(translations.schoolNamePlaceholder)}
                            />
                            {fieldErrors && fieldErrors.institution && (
                                <Typography color="danger" variant="helper" component="p">
                                    {fieldErrors.institution}
                                </Typography>
                            )}
                        </div>
                        <div className={classes.field}>
                            <SelectComponent onChange={handleEndDate} id={formation.id} value={formation.endDate} classes={classes} />
                            {fieldErrors && fieldErrors.endDate && (
                                <Typography color="danger" variant="helper" component="p">
                                    {fieldErrors.endDate}
                                </Typography>
                            )}
                        </div>
                    </div>
                    <div className={classes.fieldGroup}>
                        <div className={classes.field}>
                            <TextField
                                id={`formation_diploma_${id}`}
                                label={formatMessage(translations.diplomaTitle)}
                                placeholder={formatMessage(translations.diplomaPlaceholder)}
                                value={formation.studyType}
                                onChange={handleStudyType}
                                margin="normal"
                                error={fieldErrors && fieldErrors.studyType}
                            />

                            {fieldErrors && fieldErrors.studyType && (
                                <Typography color="danger" variant="helper" component="p">
                                    {fieldErrors.studyType}
                                </Typography>
                            )}
                        </div>
                        <div className={classes.field}>
                            <TextField
                                id={`formation_area_${id}`}
                                label={formatMessage(translations.mainCourse)}
                                placeholder={formatMessage(translations.mainCoursePlaceholder)}
                                value={formation.area}
                                onChange={handleAreaChange}
                                margin="normal"
                                error={fieldErrors && fieldErrors.area}
                            />

                            {fieldErrors && fieldErrors.area && (
                                <Typography color="danger" variant="helper" component="p">
                                    {fieldErrors.area}
                                </Typography>
                            )}
                        </div>
                    </div>
                </div>
                <Tooltip title={<FormattedMessage id="Main.lang.delete" defaultMessage="Supprimer"/>}>
                    <Button className={classes.button} onClick={onRemove(id)}>
                        <TrashIcon/>
                    </Button>
                </Tooltip>
            </ListItem>
        </div>
    );
});

const SortableFormationsItems = SortableContainer(
    ({ items, formationChanged, formationDeleted, errors, name, schools, classes }) => {
        return (
            <List>
                {items.map((formation, index) => (
                    <FormationItem
                        key={`${name}_${formation.id}_${index}`}
                        onChange={formationChanged}
                        onRemove={formationDeleted}
                        id={formation.id}
                        formationIndex={index}
                        error={errors && errors[index]}
                        {...{
                            index,
                            formation,
                            schools,
                            classes
                        }}
                    />
                ))}
            </List>
        );
    }
);

const FormationsEditForm = ({ helpers: { handleValueChange } }) => {
    const classes = useStyles();
    const {
        values: { education },
        errors: validationErrors
    } = useFormikContext();

    const errors = validationErrors?.education;

    const formationChanged = useCallback(
        (educationsIndex, field, value) => {
            handleValueChange(`education[${educationsIndex}].${field}`)(value);
        }, []
    );
    const formationDeleted = useCallback(
        deletedId => () => {
            handleValueChange('education')(education.filter(({ id }) => deletedId !== id));
        },
        [JSON.stringify(education)]
    );

    const formationAdded = useCallback(() => {
        const id = uuid();
        return handleValueChange('education')([...education, {
            position: education.length,
            id
        }]);
    }, [JSON.stringify(education)]);
    const move = useCallback(
        ({ oldIndex, newIndex }) => {
            handleValueChange('education')(arrayMove(education, oldIndex, newIndex));
        },
        [JSON.stringify(education)]
    );
    const globalError = typeof errors === 'string' && errors;

    return (
        <>
            <SortableFormationsItems
                helperClass={classes.sortableHelper}
                items={education}
                onSortEnd={move}
                distance={20}
                useDragHandle
                lockAxis="y"
                name="education"
                {...{ formationChanged, formationDeleted, errors, classes }}
            />
            <div className={classes.addButton} onClick={formationAdded}>
                <Tag className={classes.addTag}>
                    <AddIcon/>
                </Tag>
                <Typography>
                    <FormattedMessage id="Main.lang.add" defaultMessage="Ajouter"/>
                </Typography>
            </div>
            {globalError && (
                <Typography color="danger" component="p">
                    {errors}
                </Typography>
            )}
        </>
    );
};

export const StudiesCardEditDialog = ({ data, onEdit, validationSchema, onClose }) => {
    const { formatMessage } = useIntl();
    const validationSchemaToPass = useMemo(() => validationSchema(formatMessage), [validationSchema]);

    return (
        <EditDialog
            data={data}
            onEdit={onEdit}
            onClose={onClose}
            validationSchema={validationSchemaToPass}
            open
            title={<FormattedMessage id="Basics.editDialog.title" defaultMessage="Your basic information"/>}
        >
            {helpers => <FormationsEditForm helpers={helpers}/>}
        </EditDialog>
    );
};
