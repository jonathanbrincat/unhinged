import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper'
import { PivotData, sortAs, getSort } from './Utilities'
import PivotTable from './PivotTable'
import { ReactSortable } from 'react-sortablejs'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export function Dimension(props) {
  const [ isOpen, setIsOpen ] = useState(false)
  const [ filterText, setFilterText ] = useState('')
  const [ foo, setFoo ] = useState(true)

  useEffect(() => {
    console.log('hello ', foo, props?.attrValues)

    if (props?.attrValues) {
      console.log('should not be here ', Object.keys(props?.attrValues).filter(matchesFilter))

      if (foo) {
        // props.removeValuesFromFilter(
        //   props.name,
        //   Object.keys(props?.attrValues).filter(matchesFilter)
        // )
      }
      else {
        // props.addValuesToFilter(
        //   props.name,
        //   Object.keys(props?.attrValues).filter(matchesFilter)
        // )
      }
    }
  }, [foo])

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

  function getFilterPane() {
    const showMenu = Object.keys(props?.attrValues).length < props.menuLimit

    const values = Object.keys(props?.attrValues)
    const shown = values
      .filter(matchesFilter.bind(this))
      .sort(props.sorter)

    return (
      <div className="criterion__filters-pane">
        <header>
          <button onClick={() => setOpen(false)} className="pvtCloseX">&#10799;</button>
          
          <h4>{props.name}</h4>
        </header>

        {showMenu || <p>(too many values to show)</p>}

        {showMenu && (
          <div className="controls">
            <input
              type="text"
              className="pvtSearch"
              placeholder="Filter values"
              value={filterText}
              onChange={event => setFilterText(event.target.value)}
            />

            <label>
              <input type="checkbox" checked={foo} onChange={(event) => setFoo(event.target.checked)} /> Select All
            </label>

            <button
              onClick={() =>
                props.removeValuesFromFilter(
                  props.name,
                  Object.keys(props?.attrValues).filter(
                    matchesFilter.bind(this)
                  )
                )
              }
            >
              Select All
            </button>

            <button
              onClick={() =>
                props.addValuesToFilter(
                  props.name,
                  Object.keys(props?.attrValues).filter(
                    matchesFilter.bind(this)
                  )
                )
              }
            >
              Deselect All
            </button>
          </div>
        )}

        {showMenu && (
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

  const filtered =
    Object.keys(props.valueFilter).length !== 0
      ? 'pvtFilteredAttribute'
      : ''

  return (
    <li className={'dimension__list-item'} data-id={props.name}>
      <div className={`pvtAttr draggable ${filtered}`}>
        <span>{props.name}</span>
        <button
          className="dropdown-toggle"
          onClick={toggleFilterPane.bind(this)}
        >&#9662;</button>
      </div>

      {isOpen ? getFilterPane() : null}
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

class PivotTableUI extends React.PureComponent {
  // const[activeRenderer, setActiveRenderer] = useState('Grouped Column Chart');

  constructor(props) {
    super(props)
    this.state = {
      unusedOrder: [],
      attrValues: {},
      materializedInput: [],
      activeRenderer: props.rendererName in props.renderers
        ? props.rendererName
        : Object.keys(props.renderers)[0],
      activeAggregator: props.aggregatorName,
      activeDimensions: [...props.vals],
      fooList: [{ id: '1', name: 'shrek' }, { id: '2', name: 'donkey' }],
      foo: 'value_a_to_z',
      bar: 'value_z_to_a',
    }
  }

  componentDidMount() {
    this.materializeInput(this.props.data)
  }

  componentDidUpdate() {
    this.materializeInput(this.props.data)
  }

  materializeInput(nextData) {
    if (this.state.data === nextData) {
      return
    }

    const newState = {
      data: nextData,
      attrValues: {},
      materializedInput: [],
    }

    let recordsProcessed = 0

    PivotData.forEachRecord(
      newState.data,
      this.props.derivedAttributes,
      function(record) {
        newState.materializedInput.push(record)
        for (const attr of Object.keys(record)) {
          if (!(attr in newState.attrValues)) {
            newState.attrValues[attr] = {}
            if (recordsProcessed > 0) {
              newState.attrValues[attr].null = recordsProcessed
            }
          }
        }

        for (const attr in newState.attrValues) {
          const value = attr in record ? record[attr] : 'null'
          if (!(value in newState.attrValues[attr])) {
            newState.attrValues[attr][value] = 0
          }
          newState.attrValues[attr][value]++
        }

        recordsProcessed++
      }
    )

    this.setState(newState)
  }

  sendPropUpdate(command) {
    this.props.onChange(update(this.props, command))
  }

  propUpdater(key) {    
    return value => this.sendPropUpdate({[key]: {$set: value}})
  }

  setValuesInFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {
        [attribute]: {
          $set: values.reduce((r, v) => {
            r[v] = true
            return r
          }, {}),
        },
      },
    })
  }

  addValuesToFilter(attribute, values) {
    if (attribute in this.props.valueFilter) {
      this.sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce((r, v) => {
            r[v] = {$set: true}
            return r
          }, {}),
        },
      })
    } else {
      this.setValuesInFilter(attribute, values)
    }
  }

  removeValuesFromFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {[attribute]: {$unset: values}},
    })
  }

  makeDnDCell(items, onChange, classes) {
    return (
      // JB: broken; React Sortable API changed + its actually got a disclaimer announcing unstable status; list and setList props appear mandatory; drag and drop has stopped working. It appears sortable is hijacking all pointer events.
      // <ReactSortable
      <ul
        className={`dimension__list ${classes}`}
        tag="ul"
        options={{
          group: 'shared',
          ghostClass: 'pvtPlaceholder',
          filter: '.criterion__filters-pane',
          preventOnFilter: false,
        }}        
        // onChange={onChange} // JB: broken.

        // list={items}
        // setList={() => null}
        // setList={(newState) => this.setState({ fooList: newState })}
      >

        <li>wtf :: {JSON.stringify(items)}</li>
        
        {items.map(x => (
          <Dimension
            name={x}
            key={x}
            attrValues={this.state.attrValues[x]}
            valueFilter={this.props.valueFilter[x] || {}}
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={this.setValuesInFilter.bind(this)}
            addValuesToFilter={this.addValuesToFilter.bind(this)}
            removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
          />
        ))}
      </ul>
      // </ReactSortable>
    )
  }

  render() {
    const numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0

    const aggregatorCellOutlet = this.props.aggregators[this.props.aggregatorName]([])().outlet
    
    const createRendererSelector = (
      <div className="pivot__renderer">
        <select className="pvtDropdown" value={this.state.activeRenderer} onChange={(event) => { this.setState({ activeRenderer: event.target.value }); this.propUpdater('rendererName')(event.target.value) } }>
          {
            Object.keys(this.props.renderers).map(
              (item, index) => (
                <option value={item} key={index}>{item}</option>
              )
            )
          }
        </select>

        {/* <p>selected fruit = {this.state.activeRenderer}</p> */}
      </div>
    )

    const sortIcons = {
      key_a_to_z: {
        rowSymbol: '↕',
        colSymbol: '↔',
        next: 'value_a_to_z',
      },
      value_a_to_z: {
        rowSymbol: '↓',
        colSymbol: '→',
        next: 'value_z_to_a',
      },
      value_z_to_a: {rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z'},
    }

    const createCriterionSelector = (
      <aside className="pivot__dimensions">

        <div className="rowAndColumnOrder">
          {/* Should be input type radio buttons */}
          <p>Row</p>
          <label>
            <input type="radio" name="sort-row" value="key_a_to_z" checked={this.state.foo === 'key_a_to_z'} onChange={event => this.setState({ foo: event.target.value })} /> Option 1 key_a_to_z ↕
            <input type="radio" name="sort-row" value="value_a_to_z" checked={this.state.foo === 'value_a_to_z'} onChange={event => this.setState({ foo: event.target.value })} /> Option 2 value_a_to_z ↓
            <input type="radio" name="sort-row" value="value_z_to_a" checked={this.state.foo === 'value_z_to_a'} onChange={event => this.setState({ foo: event.target.value })} /> Option 3 value_z_to_a ↑
          </label>
          <p>output :: {this.state.foo}</p>

          <p>Column</p>
          <label>
            <input type="radio" name="sort-column" value="key_a_to_z" checked={this.state.bar === 'key_a_to_z'} onChange={event => this.setState({ bar: event.target.value })} /> Option 1 key_a_to_z ↔
            <input type="radio" name="sort-column" value="value_a_to_z" checked={this.state.bar === 'value_a_to_z'} onChange={event => this.setState({ bar: event.target.value })} /> Option 2 value_a_to_z →
            <input type="radio" name="sort-column" value="value_z_to_a" checked={this.state.bar === 'value_z_to_a'} onChange={event => this.setState({ bar: event.target.value })} /> Option 3 value_z_to_a ←
          </label>
          <p>output :: {this.state.bar}</p>

          <button
            onClick={() =>
              this.propUpdater('rowOrder')(sortIcons[this.props.rowOrder].next)
            }
          >
            {sortIcons[this.props.rowOrder].rowSymbol}
          </button>
          
          <button
            onClick={() =>
              this.propUpdater('colOrder')(sortIcons[this.props.colOrder].next)
            }
          >
            {sortIcons[this.props.colOrder].colSymbol}
          </button>
        </div>

        <div className="dimension__selection">
          <select className="pvtDropdown" value={this.state.activeAggregator} onChange={(event) => { this.setState({ activeAggregator: event.target.value }); this.propUpdater('aggregatorName')(event.target.value) }}>
            {
              Object.keys(this.props.aggregators).map(
                (item, index) => (
                  <option value={item} key={index}>{item}</option>
                )
              )
            }
          </select>
          
          {/* {numValsAllowed > 0 && <br />} */}
          
          {new Array(numValsAllowed).fill().map((n, i) => [
            <select className="pvtDropdown" value={this.state.activeDimensions[i]} onChange={(event) => {
              this.setState({ activeDimensions: this.state.activeDimensions.toSpliced(i, 1, event.target.value) }); this.sendPropUpdate({ vals: { $splice: [[i, 1, event.target.value]] } })
            }} key={i}>
              {
                Object.keys(this.state.attrValues).map(
                  (item, index) => (
                    !this.props.hiddenAttributes.includes(item) &&
                    !this.props.hiddenFromAggregators.includes(item) &&
                    <option value={item} key={index}>{item}</option>
                  )
                )
              }
            </select>,
            // i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
          ])}

          {aggregatorCellOutlet && aggregatorCellOutlet(this.props.data)}
        </div>
      </aside>
    )

    const unusedAttrs = Object.keys(this.state?.attrValues)
      .filter(
        e =>
          !this.props.rows.includes(e) &&
          !this.props.cols.includes(e) &&
          !this.props.hiddenAttributes.includes(e) &&
          !this.props.hiddenFromDragDrop.includes(e)
      )
      .sort(sortAs(this.state.unusedOrder))

    const unusedAttrsCell = this.makeDnDCell(
      unusedAttrs,
      order => this.setState({unusedOrder: order}),
      'pvtHorizList'
    )

    const colAttrs = this.props.cols.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    )

    const colAttrsCell = this.makeDnDCell(
      colAttrs,
      this.propUpdater('cols'),
      'pvtHorizList pvtCols'
    )

    const rowAttrs = this.props.rows.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    )

    const rowAttrsCell = this.makeDnDCell(
      rowAttrs,
      this.propUpdater('rows'),
      'pvtVertList pvtRows'
    )

    return (
      <div className="pivot__ui">
        {createRendererSelector}
        <div className="pivot__criterion">
          {unusedAttrsCell}
        </div>

        {createCriterionSelector}
        <div className="pivot__axis">
          {colAttrsCell}
        </div>

        <div className="pivot__axis">
          {rowAttrsCell}
        </div>

        <article className="pivot__output">
          <PivotTable
            {...update(this.props, {
              data: { $set: this.state.materializedInput },
            })}
          />

          {/* <pre style={{ fontSize: '10px' }}>{JSON.stringify(this.state.materializedInput, null, 2)}</pre> */}
        </article>
      </div>
    )
  }
}

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
  onChange: PropTypes.func.isRequired,
  hiddenAttributes: PropTypes.arrayOf(PropTypes.string),
  hiddenFromAggregators: PropTypes.arrayOf(PropTypes.string),
  hiddenFromDragDrop: PropTypes.arrayOf(PropTypes.string),
  menuLimit: PropTypes.number,
})

PivotTableUI.defaultProps = Object.assign({}, PivotTable.defaultProps, {
  hiddenAttributes: [],
  hiddenFromAggregators: [],
  hiddenFromDragDrop: [],
  menuLimit: 500,
  rows: [],
  cols: [],
})

export default PivotTableUI
