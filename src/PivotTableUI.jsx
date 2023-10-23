import React from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper'
import { PivotData, sortAs, getSort } from './Utilities'
import PivotTable from './PivotTable'
import Sortable from 'react-sortablejs'
import Draggable from 'react-draggable'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export class DraggableAttribute extends React.Component {
  constructor(props) {
    super(props)
    this.state = {open: false, filterText: ''}
  }

  toggleValue(value) {
    if (value in this.props.valueFilter) {
      this.props.removeValuesFromFilter(this.props.name, [value])
    } else {
      this.props.addValuesToFilter(this.props.name, [value])
    }
  }

  matchesFilter(x) {
    return x
      .toLowerCase()
      .trim()
      .includes(this.state.filterText.toLowerCase().trim())
  }

  selectOnly(e, value) {
    e.stopPropagation()
    this.props.setValuesInFilter(
      this.props.name,
      Object.keys(this.props.attrValues).filter(y => y !== value)
    )
  }

  getFilterPane() {
    const showMenu =
      Object.keys(this.props.attrValues).length < this.props.menuLimit

    const values = Object.keys(this.props.attrValues)
    const shown = values
      .filter(this.matchesFilter.bind(this))
      .sort(this.props.sorter)

    return (
      <Draggable handle=".pvtDragHandle">
        <div
          className="criterion__filters-pane"
          style={{
            display: 'block',
            cursor: 'initial',
            zIndex: this.props.zIndex,
          }}
          onClick={() => this.props.moveFilterBoxToTop(this.props.name)}
        >
          <header>
            <button onClick={() => this.setState({ open: false })} className="pvtCloseX">&#10799;</button>
            <span className="pvtDragHandle">☰</span>
            
            <h4>{this.props.name}</h4>
          </header>

          {showMenu || <p>(too many values to show)</p>}

          {showMenu && (
            <div className="controlThings">
              <input
                type="text"
                placeholder="Filter values"
                className="pvtSearch"
                value={this.state.filterText}
                onChange={e =>
                  this.setState({
                    filterText: e.target.value,
                  })
                }
              />

              {/* Should be a toggle switch UI allied to a checkbox input. */}
              <button
                className="pvtButton"
                onClick={() =>
                  this.props.removeValuesFromFilter(
                    this.props.name,
                    Object.keys(this.props.attrValues).filter(
                      this.matchesFilter.bind(this)
                    )
                  )
                }
              >
                {`Select ${values.length === shown.length ? 'All' : shown.length}`}
              </button>

              <button
                className="pvtButton"
                onClick={() =>
                  this.props.addValuesToFilter(
                    this.props.name,
                    Object.keys(this.props.attrValues).filter(
                      this.matchesFilter.bind(this)
                    )
                  )
                }
              >
                {`Deselect ${values.length === shown.length ? 'All' : shown.length}`}
              </button>
            </div>
          )}

          {showMenu && (
            <ul className="pvtCheckContainer">
              {shown.map(x => (
                <li
                  key={x}
                  onClick={() => this.toggleValue(x)}
                  className={x in this.props.valueFilter ? '' : 'selected'}
                >
                  <a className="pvtOnly" onClick={e => this.selectOnly(e, x)}>
                    only
                  </a>

                  {x === '' ? <em>null</em> : x}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Draggable>
    )
  }

  toggleFilterBox() {
    this.setState({open: !this.state.open})
    this.props.moveFilterBoxToTop(this.props.name)
  }

  render() {
    const filtered =
      Object.keys(this.props.valueFilter).length !== 0
        ? 'pvtFilteredAttribute'
        : ''

    return (
      <li className={'dimension__list-item'} data-id={this.props.name}>
        <div className={`pvtAttr draggable ${filtered}`}>
          <span>{this.props.name}</span>
          <button
            className="dropdown-toggle"
            onClick={this.toggleFilterBox.bind(this)}
          >&#9662;</button>
        </div>

        {this.state.open ? this.getFilterPane() : null}
      </li>
    )
  }
}

DraggableAttribute.defaultProps = {
  valueFilter: {},
}

DraggableAttribute.propTypes = {
  name: PropTypes.string.isRequired,
  addValuesToFilter: PropTypes.func.isRequired,
  removeValuesFromFilter: PropTypes.func.isRequired,
  attrValues: PropTypes.objectOf(PropTypes.number).isRequired,
  valueFilter: PropTypes.objectOf(PropTypes.bool),
  moveFilterBoxToTop: PropTypes.func.isRequired,
  sorter: PropTypes.func.isRequired,
  menuLimit: PropTypes.number,
  zIndex: PropTypes.number,
}

export class Dropdown extends React.PureComponent {
  render() {
    return (
      <div className="pvtDropdown" style={{zIndex: this.props.zIndex}}>
        <div
          onClick={e => {
            e.stopPropagation()
            this.props.toggle()
          }}
          className={
            'pvtDropdownValue pvtDropdownCurrent ' +
            (this.props.open ? 'pvtDropdownCurrentOpen' : '')
          }
          role="button"
        >
          <span className="pvtDropdownIcon">{this.props.open ? '\u2A2F' : '\u25BE'}</span>
          {this.props.current || <span>&nbsp;</span>}
        </div>

        {this.props.open && (
          <div className="pvtDropdownMenu">
            {this.props.values.map(r => (
              <div
                key={r}
                role="button"
                onClick={e => {
                  e.stopPropagation()
                  if (this.props.current === r) {
                    this.props.toggle()
                  } else {
                    this.props.setValue(r)
                  }
                }}
                className={
                  'pvtDropdownValue ' +
                  (r === this.props.current ? 'pvtDropdownActiveValue' : '')
                }
              >
                {r}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
}

class PivotTableUI extends React.PureComponent {
  // const[activeRenderer, setActiveRenderer] = useState('Grouped Column Chart');

  constructor(props) {
    super(props)
    this.state = {
      unusedOrder: [],
      zIndices: {},
      maxZIndex: 1000,
      openDropdown: false,
      attrValues: {},
      materializedInput: [],
      activeRenderer: props.rendererName in props.renderers
        ? props.rendererName
        : Object.keys(props.renderers)[0],
      activeAggregator: props.aggregatorName,
      activeDimensions: [...props.vals],
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
    console.log('HERE => ', key)
    
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

  moveFilterBoxToTop(attribute) {
    this.setState(
      update(this.state, {
        maxZIndex: {$set: this.state.maxZIndex + 1},
        zIndices: {[attribute]: {$set: this.state.maxZIndex + 1}},
      })
    )
  }

  isOpen(dropdown) {
    return this.state.openDropdown === dropdown
  }

  makeDnDCell(items, onChange, classes) {
    return (
      <Sortable
        options={{
          group: 'shared',
          ghostClass: 'pvtPlaceholder',
          filter: '.criterion__filters-pane',
          preventOnFilter: false,
        }}
        tag="ul"
        className={`dimension__list ${classes}`}
        onChange={onChange}
      >
        {/* JB: broken required prop attrValues */}
        {/* {items.map(x => (
          <DraggableAttribute
            name={x}
            key={x}
            attrValues={this.state.attrValues[x]}
            valueFilter={this.props.valueFilter[x] || {}}
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={this.setValuesInFilter.bind(this)}
            addValuesToFilter={this.addValuesToFilter.bind(this)}
            moveFilterBoxToTop={this.moveFilterBoxToTop.bind(this)}
            removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
            zIndex={this.state.zIndices[x] || this.state.maxZIndex}
          />
        ))} */}
      </Sortable>
    )
  }

  render() {
    const numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0

    const aggregatorCellOutlet = this.props.aggregators[this.props.aggregatorName]([])().outlet
    
    const createRendererSelector = (
      <div className="pivot__renderer">
        <select value={this.state.activeRenderer} onChange={(event) => { this.setState({ activeRenderer: event.target.value }); this.propUpdater('rendererName')(event.target.value) } }>
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
          {/* Scheulded for demolition - replace with native control */}
          <select value={this.state.activeAggregator} onChange={(event) => { this.setState({ activeAggregator: event.target.value }); this.propUpdater('aggregatorName')(event.target.value) }}>
            {
              Object.keys(this.props.aggregators).map(
                (item, index) => (
                  <option value={item} key={index}>{item}</option>
                )
              )
            }
          </select>

          {/* <Dropdown
            current={this.props.aggregatorName}
            values={Object.keys(this.props.aggregators)}
            open={this.isOpen('aggregators')}
            zIndex={this.isOpen('aggregators') ? this.state.maxZIndex + 1 : 1}
            toggle={() =>
              this.setState({
                openDropdown: this.isOpen('aggregators') ? false : 'aggregators',
              })
            }
            setValue={this.propUpdater('aggregatorName')}
          /> */}
          
          {/* {numValsAllowed > 0 && <br />} */}
          
          {/* Scheulded for demolition - replace with native control */}
          {new Array(numValsAllowed).fill().map((n, i) => [
            <select value={this.state.activeDimensions[i]} onChange={(event) => {
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
            </select>
          ])}

          {new Array(numValsAllowed).fill().map((n, i) => [
            // <Dropdown
            //   key={`foo-${i}`}
            //   current={this.props.vals[i]}
            //   values={Object.keys(this.state.attrValues).filter(
            //     e =>
            //       !this.props.hiddenAttributes.includes(e) &&
            //       !this.props.hiddenFromAggregators.includes(e)
            //   )}
            //   open={this.isOpen(`val${i}`)}
            //   zIndex={this.isOpen(`val${i}`) ? this.state.maxZIndex + 1 : 1}
            //   toggle={() =>
            //     this.setState({
            //       openDropdown: this.isOpen(`val${i}`) ? false : `val${i}`,
            //     })
            //   }
            //   setValue={value =>
            //     this.sendPropUpdate({
            //       vals: {$splice: [[i, 1, value]]},
            //     })
            //   }
            // />,
            // i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
          ])}

          {aggregatorCellOutlet && aggregatorCellOutlet(this.props.data)}
        </div>
      </aside>
    )

    const unusedAttrs = Object.keys(this.state.attrValues)
      .filter(
        e =>
          !this.props.rows.includes(e) &&
          !this.props.cols.includes(e) &&
          !this.props.hiddenAttributes.includes(e) &&
          !this.props.hiddenFromDragDrop.includes(e)
      )
      .sort(sortAs(this.state.unusedOrder))

    // JB: broken
    // const unusedAttrsCell = this.makeDnDCell(
    //   unusedAttrs,
    //   order => this.setState({unusedOrder: order}),
    //   'pvtHorizList'
    // )

    const colAttrs = this.props.cols.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    )

    // JB: broken
    // const colAttrsCell = this.makeDnDCell(
    //   colAttrs,
    //   this.propUpdater('cols'),
    //   'pvtHorizList pvtCols'
    // )

    const rowAttrs = this.props.rows.filter(
      e =>
        !this.props.hiddenAttributes.includes(e) &&
        !this.props.hiddenFromDragDrop.includes(e)
    )

    // JB: broken
    // const rowAttrsCell = this.makeDnDCell(
    //   rowAttrs,
    //   this.propUpdater('rows'),
    //   'pvtVertList pvtRows'
    // )

    return (
      <div className="pivot__ui" onClick={() => this.setState({ openDropdown: false })}>
        {createRendererSelector}
        <div className="pivot__criterion">
          {/* {unusedAttrsCell} */}
        </div>

        {createCriterionSelector}
        <div className="pivot__axis">
          {/* {colAttrsCell} */}
        </div>

        <div className="pivot__axis">
          {/* {rowAttrsCell} */}
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
})

export default PivotTableUI
