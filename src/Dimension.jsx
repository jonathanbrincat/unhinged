import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export default function Dimension(props) {
  const [ isOpen, setIsOpen ] = useState(false)
  const [ filterText, setFilterText ] = useState('')
  const [isAllFilters, setIsAllFilters ] = useState(true)

  // JB: This is ultimately being used to update the valueFilter:{} prop on root node <App />. This should be a custom hook with setValueFilter({ ...valueFilter, [props.name]: Object.keys(props?.attrValues).filter(matchesFilter) })
  useEffect(() => {
    // console.log('hello ', isAllFilters, props?.attrValues)

    // if (props?.attrValues) {
    //   // console.log('should not be here ', Object.keys(props?.attrValues).filter(matchesFilter))

    //   if (isAllFilters) {
    //     props.removeValuesFromFilter(
    //       props.name,
    //       Object.keys(props?.attrValues).filter(matchesFilter)
    //     )
    //   }
    //   else {
    //     props.addValuesToFilter(
    //       props.name,
    //       Object.keys(props?.attrValues).filter(matchesFilter)
    //     )
    //   }
    // }
  }, [isAllFilters])

  function toggleValue(value) {
    if (value in props.valueFilter) {
      props.removeValuesFromFilter(props.name, [value])
    } else {
      props.addValuesToFilter(props.name, [value])
    }
  }

  function matchesFilter(x) {
    return x
      .toLowerCase()
      .trim()
      .includes(filterText.toLowerCase().trim())
  }

  function selectOnly(event, value) {
    event.stopPropagation()
    props.setValuesInFilter(
      props.name,
      Object.keys(props?.attrValues).filter(y => y !== value)
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
      <div className="criterion__filters-pane">
        <header>
          <button onClick={() => setIsOpen(false)} className="pvtCloseX">&#10799;</button>
          
          <h4>{props.name}</h4>
        </header>

        {isMenuLimit || <p>(too many values to show)</p>}

        {/* JB: temporarily turned off; not a priority feature */}
        {isMenuLimit && (
          <div className="controls">
            {/* <input
              type="text"
              className="filter__search pvtSearch"
              placeholder="Filter values"
              value={filterText}
              onChange={event => setFilterText(event.target.value)}
            />

            <label className="filter__select-all-toggle">
              <input type="checkbox" checked={isAllFilters} onChange={(event) => setIsAllFilters(event.target.checked)} />
              <span>Select All</span>
            </label> */}

            <button
              onClick={() =>
                props.removeValuesFromFilter(
                  props.name,
                  Object.keys(props?.attrValues).filter(matchesFilter)
                )
              }
            >
              Select All
            </button>

            <button
              onClick={() =>
                props.addValuesToFilter(
                  props.name,
                  Object.keys(props?.attrValues).filter(matchesFilter)
                )
              }
            >
              Deselect All
            </button>
          </div>
        )}

        {isMenuLimit && (
          <ul className="pvtCheckContainer">
            {shown.map(x => (
              <li
                key={x}
                onClick={() => toggleValue(x)}
                className={x in props.valueFilter ? '' : 'selected'}
              >
                <a className="pvtOnly" onClick={e => selectOnly(e, x)}>
                  only
                </a>

                {x === '' ? <em>null</em> : x}
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
          className="dropdown-toggle"
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
}

Dimension.propTypes = {
  name: PropTypes.string.isRequired,
  addValuesToFilter: PropTypes.func.isRequired,
  removeValuesFromFilter: PropTypes.func.isRequired,
  attrValues: PropTypes.objectOf(PropTypes.number),
  valueFilter: PropTypes.objectOf(PropTypes.bool),
  sorter: PropTypes.func.isRequired,
  menuLimit: PropTypes.number,
}
