import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper' // JB: candidate for deletion now that I've identified what it is used for
import { PivotData, sortAs, getSort } from './Utilities'
import PivotTable from './PivotTable'
import { ReactSortable } from 'react-sortablejs'
import { sortBy } from './constants'

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
      <div className={`pivot__dimension sortable ${filteredClass}`}>
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


class PivotTableUI extends React.PureComponent {
  // const[activeRenderer, setActiveRenderer] = useState('Grouped Column Chart');

  constructor(props) {
    super(props)
    console.log('props => ', props)

    this.state = {
      unusedOrder: [], // JB: doesn't seem to serve a purpose
      attrValues: {}, // JB: appears to get generated. related to materializeInput()
      materializedInput: [], // JB: this is bizarre. this state appears to be being used as a placeholder for generated data; begs the question why? state is ephemeral // related to materializeInput() // equivalent to data
      activeRenderer: props.rendererName in props.renderers
        ? props.rendererName
        : Object.keys(props.renderers)[0],
      activeAggregator: props.aggregatorName,
      activeDimensions: [...props.vals],
      sortByRow: 'value_a_to_z',
      sortByColumn: 'value_z_to_a',

      // JB: attribute/dimension/criterion decide on naming and stick to the convention
      fooCriterion: [],
      fooRows: [],
      fooCols: [],
      
      dimensions: (() => {
        const foo = {}
        let recordsProcessedTally = 0 // this is how the values are generated. by counting occurances

        PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {

          // examine every key of every record
          for (const attr of Object.keys(record)) {
            
            // if key doesn't exist yet
            if (!(attr in foo)) {
              // add the key to our dictionary // use Map()??
              foo[attr] = {}

              if (recordsProcessedTally > 0) {
                foo[attr].null = recordsProcessedTally
              }

              // console.log(attr)
            }
          }

          // for every key that exists on foo
          for (const attr in foo) {
            const value = attr in record ? record[attr] : 'null'

            // if there isn't a value already assigned. zero the figure.
            if (!(value in foo[attr])) {
              foo[attr][value] = 0
            }

            // increment the occurance count/tally
            foo[attr][value]++
          }
          
          
          recordsProcessedTally++
        })

        return foo
      })(), // sort array??

      newMaterializedInput: (() =>{
        const foo = []

        PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {
          foo.push(record)
        })

        return foo
      })(),
    }
  }

  // JB: stupid. should be using props.data to initialise state upon instantiation. not the lifecycle. then reactivity to maintain state thereafter. again not the lifecycle.
  componentDidMount() {
    this.materializeInput(this.props.data) // JB: REMOVE

    this.setState({
      fooCriterion: Object.keys(this.state.dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({name}) =>
            !this.props.hiddenAttributes.includes(name) &&
            !this.props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({name}) => 
            !this.props.rows.includes(name) &&
            !this.props.cols.includes(name)
        ),
      
      fooRows: Object.keys(this.state.dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({name}) =>
            !this.props.hiddenAttributes.includes(name) &&
            !this.props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({name}) =>
            this.props.rows.includes(name)
        ),

      fooCols: Object.keys(this.state.dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({name}) =>
            !this.props.hiddenAttributes.includes(name) &&
            !this.props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({name}) =>
            this.props.cols.includes(name)
        ),
    })

    // fooRows: props.rows.map((item, index) => ({ id: `dimension${--index}`, name: item })),
    // fooCols: props.cols.map((item, index) => ({ id: `dimension${++index}`, name: item })),
  }

  // JB: pointless. effectively forcibly reparsing the data every time the component renders. not reactivity. Seems weird. As far as I've discerned props.data never changes anyway from it's initial state ie. not being recirculated like other props
  componentDidUpdate() {
    this.materializeInput(this.props.data) // JB: REMOVE
  }

  materializeInput(nextData) {

    // JB: if the data is the same i.e. nothing is new dont do anything. isn't this what reactivity is for??
    // also I don't really understand why the hydrating data would be expected to change like this
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
      this.props.derivedAttributes, //  JB: derivedAttributes doesn't seem to serve any purpose. empty {}
      function (record) { // JB: callback function; will be executed in the closure of PivotData utility
        
        // JB: is this some sort of masssaging of the data? I guess packaging it in the way pivottable.js understands?
        newState.materializedInput.push(record)

        // JB: parsing for the attributes/values/dimensions
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

    this.setState(newState) // JB: overwrite the old with the new. data; attrValues; materializedInput
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
  propUpdater(key) {    
    return value => this.sendPropUpdate({[key]: {$set: value}})

    // JB - start
    // const test = (value) => this.sendPropUpdate({[key]: {$set: value}})
    // console.log('propUpdater() => ', test('rendererName')(event.target.value))
    // propUpdater('rendererName')(event.target.value)
    // return test
    // end
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
      <ReactSortable
        className="dimension__list"
        tag="ul"
        list={items}
        setList={onSortableChangeHandler}
        // list={this.state.fooList1}
        // setList={(newState) => this.setState({ fooList1: newState })}
        group="pivot__dimensions"
        ghostClass="sortable--ghost"
        chosenClass="sortable--chosen"
        dragClass="sortable--drag"
        filter=".criterion__filters-pane"
        preventOnFilter={false}
      >
        {
          items.map(
            (item, index) => {
              return (
                <li className="ui__button sortable" key={`${item.id}-${index}`}>{item.name}</li>
              )
            }
          )
        }

        {/* each items entry is being tranformed by ReactSortable. string to Object with flags; can't have the two in situ. breaks Dimensios proptypes + expectations */}
        {/* {items.map(x => (
          <Dimension
            name={x}
            key={x}
            attrValues={this.state?.attrValues[x]}
            valueFilter={this.props.valueFilter[x] || {}}
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={this.setValuesInFilter.bind(this)}
            addValuesToFilter={this.addValuesToFilter.bind(this)}
            removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
          />
        ))} */}
      </ReactSortable>
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
              this.propUpdater('rendererName')(event.target.value) // JB: REMOVE
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
                        this.propUpdater('rowOrder')(this.state.sortByRow) // JB: REMOVE
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
                        this.propUpdater('colOrder')(this.state.sortByColumn) // JB: REMOVE
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
                this.propUpdater('aggregatorName')(event.target.value) // JB: REMOVE
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
                Object.keys(this.state?.attrValues).map(
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

  render() {
    // console.log('attrValues :state: ', this.state?.attrValues)
    // console.log('dimensions :state: ', this.state.dimensions)
    // console.log('materializedInput :state: ', this.state?.materializedInput)
    // console.log('derivedAttributes :prop: ', this.props.derivedAttributes)

    // const criterionCollection = Object.keys(this.state?.attrValues)
    //   .filter(
    //     (item) => {
    //       return (
    //         !this.props.rows.includes(item) &&
    //         !this.props.cols.includes(item) &&
    //         !this.props.hiddenAttributes.includes(item) &&
    //         !this.props.hiddenFromDragDrop.includes(item)
    //       )
    //     }
    //   )
    //   .sort(sortAs(this.state.unusedOrder))

    const criterion = this.createCluster(
      this.state.fooCriterion,
      collection => this.setState({ fooCriterion: collection }),
      // criterionCollection,
      // order => this.setState({ unusedOrder: order }),
    )

    const axisX = this.createCluster(
      this.state.fooCols,
      cols => {
        this.setState({ fooCols: cols })
        this.propUpdater('cols') // JB: REMOVE
      },
    )

    const axisY = this.createCluster(
      this.state.fooRows,
      rows => {
        this.setState({ fooRows: rows })
        this.propUpdater('rows') // JB: REMOVE
      },
    )
    
    return (
      <div className="pivot__ui">
        {this.createRendererSelector()}

        {this.createPlotSelector()}
        
        <div className="pivot__criterion">
          {criterion}
          <pre style={{ fontSize: '8px' }}>FooCriterion {JSON.stringify(this.state.fooCriterion, null, 2)}</pre>
        </div>

        <div className="pivot__axis pivot__axis-x">
          {axisX}
          <pre style={{ fontSize: '8px' }}>fooCols = {JSON.stringify(this.state.fooCols, null, 2)}</pre>
        </div>

        <div className="pivot__axis pivot__axis-y">
          {axisY}
          <pre style={{ fontSize: '8px' }}>fooRows = {JSON.stringify(this.state.fooRows, null, 2)}</pre>
        </div>

        <article className="pivot__output">
          <pre style={{ fontSize: '10px' }}>
            original :rendererName: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.rendererName,
              null, 2)
            }
            <br/>
            original :aggregatorName: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.aggregatorName,
                null, 2)
            }
            <br/>
            original :rowOrder: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.rowOrder,
                null, 2)
            }
            <br />
            original :colOrder: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.colOrder,
                null, 2)
            }
            <br />
            original :rows: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.rows,
                null, 2)
            }
            <br />
            original :cols: {
              JSON.stringify(
                {
                  ...update(this.props, { data: { $set: this.state.materializedInput } })
                }.cols,
                null, 2)
            }
          </pre>

          {/* <pre style={{ fontSize: '10px' }}>
            props being passed from parent :: {
              JSON.stringify(
                Object.keys(this.props).filter((item) => item !== 'data'),
                null, 2)
            }
          </pre> */}

          <pre style={{ fontSize: '10px' }}>
            state :activeRenderer => rendererName: {
              JSON.stringify(
                this.state.activeRenderer,
                null, 2)
            }
            <br/>
            state :activeAggregator => aggregatorName: {
              JSON.stringify(
                this.state.activeAggregator,
                null, 2)
            }
            <br />
            state :sortByRow => rowOrder: {
              JSON.stringify(
                this.state.sortByRow,
                null, 2)
            }
            <br />
            state :sortByColumn => colOrder: {
              JSON.stringify(
                this.state.sortByColumn,
                null, 2)
            }
          </pre>

          <pre>
            {JSON.stringify(this.props.rows, null, 2)}
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
            rows={this.state.fooRows.map(({name}) => name)} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE this.props.rows
            cols={this.state.fooCols.map(({ name }) => name)} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE this.props.cols
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
          Unused Props
          ===========
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
  // onChange: PropTypes.func.isRequired,
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
