import React, { Component } from 'react';
import { SectionList } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import DateSectionHeader from './DateSectionHeader';

export default class DateSectionList extends Component {
  // eslint-disable-next-line max-statements
  _getSectionTitle(item) {
    const date = moment(new Date(item.createdAt * 1000));
    const now = moment();
    const yesterday = moment().subtract(1, 'days');
    const lastWeek = moment().subtract(1, 'weeks');

    if (date.isSame(now, 'day')) {
      return 'Today';
    }

    if (date.isSame(yesterday, 'day')) {
      return 'Yesterday';
    }

    if (date.isSame(now, 'week')) {
      return moment.weekdays(date.weekday());
    }

    if (date.isSame(lastWeek, 'week')) {
      return 'Last Week';
    }

    if (date.isSame(now, 'year')) {
      return date.format('MMMM');
    }

    return date.format('MMMM, YYYY');
  }

  _getSections(items) {
    const sections = {};

    items.forEach((item) => {
      const title = this._getSectionTitle(item);

      if (!sections[title]) {
        sections[title] = [];
      }

      sections[title].push(item);
    });

    return Object.keys(sections).map((title) => ({
      title,
      data: sections[title]
    }));
  }

  render() {
    const { data, inverted } = this.props;
    const sections = this._getSections(data);
    const renderSectionHeaderPropName = inverted ? 'renderSectionFooter' : 'renderSectionHeader';

    const renderSectionHeaderProps = {
      [renderSectionHeaderPropName]: ({ section: { title } }) => (
        <DateSectionHeader title={title} />
      )
    };

    return (
      <SectionList
        {...this.props}
        {...renderSectionHeaderProps}
        sections={sections}
      />
    );
  }
}

DateSectionList.propTypes = {
  data: PropTypes.array.isRequired,
  inverted: PropTypes.bool
};