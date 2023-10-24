import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper' // JB: candidate for deletion now that I've identified what it is used for
import { PivotData, sortAs, getSort } from './Utilities'
import PivotTable from './PivotTable'
import { ReactSortable } from 'react-sortablejs'

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export function Dimension(props) {
  const [ isOpen, setIsOpen ] = useState(false)
  const [ filterText, setFilterText ] = useState('')
  const [ foo, setFoo ] = useState(true)

  // JB: This is ultimately being used to update the valueFilter:[] prop on root node <App />. This should be a custom hook with setValueFilter({ ...valueFilter, [props.name]: Object.keys(props?.attrValues).filter(matchesFilter) })
  useEffect(() => {
    // console.log('hello ', foo, props?.attrValues)

    // if (props?.attrValues) {
    //   // console.log('should not be here ', Object.keys(props?.attrValues).filter(matchesFilter))

    //   if (foo) {
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

  function createFilterPane() {
    const isMenu = Object.keys(props?.attrValues).length < props.menuLimit

    const shown = Object.keys(props?.attrValues)
                    .filter(matchesFilter.bind(this))
                    .sort(props.sorter)

    return (
      <div className="criterion__filters-pane">
        <header>
          <button onClick={() => setIsOpen(false)} className="pvtCloseX">&#10799;</button>
          
          <h4>{props.name}</h4>
        </header>

        {isMenu || <p>(too many values to show)</p>}

        {isMenu && (
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

        {isMenu && (
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
    <li className={'dimension__list-item'} data-id={props.name}>
      <div className={`pivot__dimension draggable ${filteredClass}`}>
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

const sortBy = {
  row: [
    {
      label: '↕',
      value: 'key_a_to_z',
    },
    {
      label: '↓',
      value: 'value_a_to_z',
    },
    {
      label: '↑',
      value: 'value_z_to_a',
    }
  ],
  column: [
    {
      label: '↔',
      value: 'key_a_to_z',
    },
    {
      label: '→',
      value: 'value_a_to_z',
    },
    {
      label: '←',
      value: 'value_z_to_a',
    }
  ],
}

class PivotTableUI extends React.PureComponent {
  // const[activeRenderer, setActiveRenderer] = useState('Grouped Column Chart');

  constructor(props) {
    super(props)

    console.log('props => ', props)
    // console.log(props.rendererName, props.renderers) // maps to state.activeRenderer; then remapped to props.rendererName every time this changes
    /*
    aggregatorName: "Count"
    aggregators: {Count: ƒ, Count Unique Values: ƒ, List Unique Values: ƒ, Sum: ƒ, Integer Sum: ƒ, …}
    colOrder: "key_a_to_z"
    cols: ['Party Size']
    rows: ['Payer Gender']
    rowOrder: "key_a_to_z"
    data: (245) [Array(7), Array(7), Array(7), Array(7), …]
    derivedAttributes: {}
    hiddenAttributes: []
    hiddenFromAggregators: []
    hiddenFromDragDrop: []
    menuLimit: 500
    onChange: ƒ onChange(state)
    plotlyConfig: {}
    plotlyOptions: {width: 900, height: 500}
    rendererName: "Grouped Column Chart"
    renderers: {Table: ƒ, Table Heatmap: ƒ, Table Col Heatmap: ƒ, Table Row Heatmap: ƒ, Exportable TSV: ƒ, …}
    sorters: {Meal: ƒ, Day of Week: ƒ}
    tableColorScaleGenerator: ƒ redColorScaleGenerator(values)
    tableOptions: {}
    vals: (2) ['Tip', 'Total Bill']
    valueFilter: {}
    */

    this.state = {
      unusedOrder: [],
      attrValues: {},
      materializedInput: [], // JB: this is bizarre. this state appears to be being used as a placeholder for generated data; begs the question why? state is ephemeral
      activeRenderer: props.rendererName in props.renderers
        ? props.rendererName
        : Object.keys(props.renderers)[0],
      activeAggregator: props.aggregatorName,
      activeDimensions: [...props.vals],
      sortByRow: 'value_a_to_z',
      sortByColumn: 'value_z_to_a',
      fooList: [{ id: '1', name: 'shrek' }, { id: '2', name: 'donkey' }],
      fooRows: this.whitelist(props.rows),
      fooCols: this.whitelist(props.cols),
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

  // Have to deal with this too; propUpdater was essentially a proxy function to this
  // props.valueFilter and props.val being recirculated
  // 0/4 usages shutdown
  sendPropUpdate(command) {
    console.log('sendPropUpdate() :: ', this.props, ' => ', command)
    // console.log('sendPropUpdate() :: ', update(this.props, command)) // <= confirmation it is something off with this library. https://www.npmjs.com/package/immutability-helper

    this.props.onChange(update(this.props, command))
  }

  // 6/6 usages shutdown - SUNSETTED
  /*
  propUpdater(key) {    
    return value => this.sendPropUpdate({[key]: {$set: value}})

    // JB - start
    // const test = (value) => this.sendPropUpdate({[key]: {$set: value}})
    // console.log('propUpdater() => ', test('rendererName')(event.target.value))
    // propUpdater('rendererName')(event.target.value)
    // return test
    // end
  }
  */

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
    console.log('up ', attribute, values)

    // JB: temp commented whilst troubleshoot
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
    // console.log('down ', this.props)
    // console.log('down ', attribute, { $unset: values })

    // JB - start
    // const command = { valueFilter: { [attribute]: { $unset: values } }  } //$unset to remove. $set to add.
    // console.log('COMMANDO 2 ', update(this.props, command))
    // end

    this.sendPropUpdate({
      valueFilter: { [attribute]: { $unset: values } }, // $unset = remove the list of keys in array from the target object. is this actually appropiate? for empty array.
    })
  }

  createCluster(items, onSortableChangeHandler) {
    return (
      // JB: broken; Need to investigate. React Sortable API changed + its actually got a disclaimer announcing unstable status; list and setList props appear mandatory; drag and drop has stopped working. It appears sortable is hijacking all pointer events.
      // <ReactSortable
      <ul
        className={`dimension__list`}
        tag="ul"
        options={{
          group: 'shared',
          ghostClass: 'draggable-ghost',
          filter: '.criterion__filters-pane',
          preventOnFilter: false,
        }}        
        onChange={onSortableChangeHandler} // JB: broken. Need to investigate. related to the issues experienced with using propUpdater(), the immutability-helper library and the funkiness with recirculating props. No longer throwing errors now I've adjusted this implementation

        // list={items}
        // setList={() => null}
        // setList={(newState) => this.setState({ fooList: newState })}
      >

        {/* <li>wtf :: {JSON.stringify(items)}</li> */}
        
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

  createRendererSelector() {
    return (
      <header className="pivot__renderer">
        <select
          className="ui__select"
          value={this.state.activeRenderer}
          onChange={
            (event) => this.setState(
              { activeRenderer: event.target.value },
              // this.propUpdater('rendererName')(event.target.value) // JB: REMOVE
            )
          }
        >
          {
            Object.keys(this.props.renderers).map(
              (item, index) => (
                <option value={item} key={index}>{item}</option>
              )
            )
          }
        </select>

        {/* <p>selected renderer(state) = {this.state.activeRenderer}</p> */}
        {/* <p>selected renderer(prop) = {this.props.rendererName}</p> */}
      </header>
    )
  }

  createPlotSelector() {
    const numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0

    const aggregatorCellOutlet = this.props.aggregators[this.props.aggregatorName]([])().outlet

    return (
      <aside className="pivot__plot">
        <div className="plot__sortOrderBy">
          <div>
            <h4>Sort by row / y-axis</h4>
            {
              sortBy.row.map((item, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    name="sort-by-row"
                    value={item.value}
                    checked={this.state.sortByRow === item.value}
                    onChange={event =>
                      this.setState(
                        { sortByRow: event.target.value },
                        // this.propUpdater('rowOrder')(this.state.sortByRow) // JB: REMOVE
                      )
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))
            }
          </div>

          <div>
            <h4>Sort by column / x-axis</h4>
            {
              sortBy.column.map((item, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    name="sort-by-column"
                    value={item.value}
                    checked={this.state.sortByColumn === item.value}
                    onChange={event =>
                      this.setState(
                        { sortByColumn: event.target.value },
                        // this.propUpdater('colOrder')(this.state.sortByColumn) // JB: REMOVE
                      )
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))
            }
          </div>
        </div>

        <div className="plot__aggregator">
          <select
            className="ui__select"
            value={this.state.activeAggregator}
            onChange={
              (event) => this.setState(
                { activeAggregator: event.target.value },
                // this.propUpdater('aggregatorName')(event.target.value) // JB: REMOVE
              )
            }
          >
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
            <select
              className="ui__select"
              value={this.state.activeDimensions[i]}
              onChange={
                (event) => {
                  this.setState({ activeDimensions: this.state.activeDimensions.toSpliced(i, 1, event.target.value) })
                  this.sendPropUpdate({ vals: { $splice: [[i, 1, event.target.value]] } })
                }
              }
              key={i}
            >
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
  }

  whitelist(collection) {
    return collection.filter(
      (item) =>
        !this.props.hiddenAttributes.includes(item) &&
        !this.props.hiddenFromDragDrop.includes(item)
    )
  }

  render() {
    const criterionCollection = Object.keys(this.state?.attrValues)
      .filter(
        (item) =>
          !this.props.rows.includes(item) &&
          !this.props.cols.includes(item) &&
          !this.props.hiddenAttributes.includes(item) &&
          !this.props.hiddenFromDragDrop.includes(item)
      )
      .sort(sortAs(this.state.unusedOrder))

    const criterion = this.createCluster(
      criterionCollection,
      order => this.setState({ unusedOrder: order }),
    )

    const axisX = this.createCluster(
      this.state.fooCols,
      cols => this.setState({ fooCols: cols }),
      // this.propUpdater('cols'), // JB: REMOVE
    )

    const axisY = this.createCluster(
      this.state.fooRows,
      rows => this.setState({ fooRows: rows }),
      // this.propUpdater('rows'), // JB: REMOVE
    )
    
    return (
      <div className="pivot__ui">
        {this.createRendererSelector()}

        {this.createPlotSelector()}

        <div className="pivot__criterion">
          {criterion}
        </div>

        <div className="pivot__axis pivot__axis-x">
          {axisX}
        </div>

        <div className="pivot__axis pivot__axis-y">
          {axisY}
        </div>

        <article className="pivot__output">
          <pre style={{ fontSize: '10px' }}>
            original :: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.rendererName,
              null, 2)
            }
          </pre>

          <pre style={{ fontSize: '10px' }}>
            prop :: {
              JSON.stringify(
                Object.keys(this.props).filter((item) => item !== 'data'),
                null, 2)
            }
          </pre>

          <pre style={{ fontSize: '10px' }}>
            state :: {
              JSON.stringify(
                this.state.activeRenderer,
                null, 2)
            }
          </pre>

          {/* Confirmed what is being done. props are being recirculated for the purpose to then pump them into the <PivotTable /> business end. */}
          
          <PivotTable
            data={this.state.materializedInput} // not really options // separated from props
            renderers={this.props.renderers} // not really options
            aggregators={this.props.aggregators} // not really options
            rendererName={this.state.activeRenderer} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            aggregatorName={this.state.activeAggregator} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            rowOrder={this.state.sortByRow} // unused // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            colOrder={this.state.sortByColumn} // unused // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            rows={this.props.rows} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            cols={this.props.cols} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            vals={this.props.vals} // sendPropUpdate YES // keep track of the dimension available against the aggregator in the dynamic dropdowns
            sorters={this.props.sorters}
            valueFilter={this.props.valueFilter} // sendPropUpdate YES // doesn't actually exist; used by filters component
            derivedAttributes={this.props.derivedAttributes} // unused
            menuLimit={this.props.menuLimit} // unused
            plotlyOptions={this.props.plotlyOptions}
            plotlyConfig={this.props.plotlyConfig} // empty
            tableOptions={this.props.tableOptions} // empty
            // tableColorScaleGenerator={this.props.tableColorScaleGenerator} // unused
          />
          {/* 
          onChange
          hiddenAttributes
          hiddenFromAggregators
          hiddenFromDragDrop
          menuLimit

          USED ONLY BY UI. Arguably there are more props that could be included rows? cols? vals? valueFilter?

          we still need to spread props however in combination with state ...{...this.props, data: this.state.data, renderName: this.state.activeRenderer}
          */}

          {/* JB: whats going on here with this silly update() method?? should be passing state as props not spreading props!! */}
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
