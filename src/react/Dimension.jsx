import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'

import './dimension.css'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export default function Dimension(props) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [isAllFilters, setIsAllFilters] = useState(true)

  useEffect(() => {
    if (props?.attrValues) {

      if (isAllFilters) {
        props.removeValuesFromFilter(
          props.name,
          // Object.keys(props?.attrValues).filter(matchesFilter)
          Object.keys(props?.attrValues)
        )
      }
      else {
        props.addValuesToFilter(
          props.name,
          // Object.keys(props?.attrValues).filter(matchesFilter) // JB: I think the idea of this is to make the select/deselect all functionality elastic to what is entered in the text input. It's very counter-intuitive.
          Object.keys(props?.attrValues)
        )
      }
    }
  }, [isAllFilters])

  function matchesFilter(filters) {
    return filters
      .toLowerCase()
      .trim()
      .includes(filterText.toLowerCase().trim()) // JB: matched against filterText?? this is silly. doesn't make sense. what is it trying to achieve?
  }

  function toggleValue(value) {
    if (value in props.valueFilter) {
      props.removeValuesFromFilter(props.name, [value])
    } else {
      props.addValuesToFilter(props.name, [value])
    }
  }

  function selectOnly(event, value) {
    event.stopPropagation()
    props.setAllValuesInFilter(
      props.name,
      Object.keys(props?.attrValues).filter(item => item !== value)
    )
  }

  function toggleFilterPane() {
    setIsOpen(!isOpen)
  }

  function createFilterPane() {
    const isMenuLimit = Object.keys(props?.attrValues).length < props.menuLimit

    const shown = Object.keys(props?.attrValues)
                    .filter(matchesFilter.bind(this))
                    .sort(props.sorter)

    return (
      <div className="dimension__dropdown">
        <header className="dimension__dropdown-header">
          <button onClick={() => setIsOpen(false)} className="dimension__dropdown-close">&#10799;</button>
          
          <h4>{props.name}</h4>
        </header>

        {isMenuLimit || <p>(too many values to show)</p>}

        {isMenuLimit && (
          <div className="dimension__filters-toolbar">
            <input
              type="text"
              className="control__filters-search"
              placeholder="Filter values"
              value={filterText}
              onChange={event => setFilterText(event.target.value)}
            />

            <label className="control__filters-all-toggle">
              <input
                type="checkbox"
                ref={($input) => { if ($input) $input.indeterminate = props.isIndeterminate }}
                checked={isAllFilters}
                onChange={(event) => setIsAllFilters(event.target.checked)}
              />
              <span>Select All</span>
            </label>
          </div>
        )}

        {isMenuLimit && (
          <ul className="filters__list">
            {shown.map(item => (
              <li
                key={item}
                onClick={() => toggleValue(item)}
                className={`filters__list-item ${item in props.valueFilter ? '' : 'filters__list-item--selected'}`}
              >
                <div className="pivot__filter">
                  <a className="filter__toggle-only" onClick={event => selectOnly(event, item)}>
                    only
                  </a>

                  {item === '' ? <em>null</em> : item}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const filteredClass = Object.keys(props.valueFilter).length !== 0
                          ? 'pivot__dimension--filter'
                          : ''

  return (
    <li className="dimension__list-item sortable" data-id={props.name}>
      <div className={`pivot__dimension ${filteredClass}`}>
        <span>{props.name}</span>
        <button
          className="dimension__dropdown-toggle"
          onClick={toggleFilterPane.bind(this)}
        >&#9662;</button>
      </div>

      {isOpen ? createFilterPane() : null}
    </li>
  )
}

Dimension.defaultProps = {
  attrValues: {},
  valueFilter: {},
  isIndeterminate: false,
}

Dimension.propTypes = {
  name: PropTypes.string.isRequired,
  setAllValuesInFilter: PropTypes.func.isRequired,
  addValuesToFilter: PropTypes.func.isRequired,
  removeValuesFromFilter: PropTypes.func.isRequired,
  attrValues: PropTypes.objectOf(PropTypes.number),
  valueFilter: PropTypes.objectOf(PropTypes.bool),
  sorter: PropTypes.func.isRequired,
  menuLimit: PropTypes.number,
  isIndeterminate: PropTypes.bool
}
