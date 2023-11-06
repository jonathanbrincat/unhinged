import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import update from 'immutability-helper' // JB: candidate for deletion now that I've identified what it is used for
import { PivotData, sortAs, getSort } from './Utilities'
import Dimension from './Dimension'
import PivotTable from './PivotTable'
import { ReactSortable } from 'react-sortablejs'
import { sortBy } from './constants'

/*
data
  => parsed and packaged for pivottablel usage
  => dimensions extracted

extensions
  => renderers
  => aggregators

configuration

local state(UI orchestration)

*/

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

export default function PivotTableUI(props) {
  const [data, setData] = useState([]) // JB: only used for caching to run comparison to prevent endless render
  const [unusedOrder, setUnusedOrder] = useState([]) // JB: doesn't seem to serve a purpose
  const [attrValues, setAttrValues] = useState({}) // JB: appears to get generated. related to materializeInput()
  const [materializedInput, setMaterializedInput] = useState([])
  const [activeRenderer, setActiveRenderer] = useState(
    props.rendererName in props.renderers
      ? props.rendererName
      : Object.keys(props.renderers)[0]
  )
  const [activeAggregator, setActiveAggregator] = useState(props.aggregatorName)
  const [activeDimensions, setActiveDimensions] = useState([...props.vals])
  const [sortByRow, setSortByRow] = useState(sortBy.row[0].value)
  const [sortByColumn, setSortByColumn] = useState(sortBy.column[0].value)
  const [fooCriterion, setFooCriterion] = useState([]) // JB: attribute/dimension/criterion decide on naming and stick to the convention;
  const [fooRows, setFooRows] = useState([]) // JB: row/column x/y
  const [fooCols, setFooCols] = useState([])
  const [temp, setTemp] = useState(false)
  const [dimensions, setDimensions] = useState({})
  const [newMaterializedInput, setNewMaterializedInput] = useState([])

  useEffect(() => {
    console.log('-- mounted --')
  }, [])

  useEffect(() => {
    console.log('-- data changed --')

    materializeInput(props.data) // JB: REMOVE

    // parseDimensions()
    // parseData()

    // JB: if this was a functional component this could be a useEffect bound to [data]
    setDimensions({...parseDimensions()})
    setNewMaterializedInput([...parseData()])

    setFooCriterion(
      Object.keys(dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({ name }) =>
            !props.hiddenAttributes.includes(name) &&
            !props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({ name }) =>
            !props.rows.includes(name) &&
            !props.cols.includes(name)
        )
    )

    setFooRows(
      Object.keys(dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({ name }) =>
            !props.hiddenAttributes.includes(name) &&
            !props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({ name }) =>
            props.rows.includes(name)
        )
    )

    setFooCols(
      Object.keys(dimensions)
        .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
        .filter(
          ({ name }) =>
            !props.hiddenAttributes.includes(name) &&
            !props.hiddenFromDragDrop.includes(name)
        )
        .filter(
          ({ name }) =>
            props.cols.includes(name)
        )
    )

    // fooRows: props.rows.map((item, index) => ({ id: `dimension${--index}`, name: item })),
    // fooCols: props.cols.map((item, index) => ({ id: `dimension${++index}`, name: item })),
  }, [props.data])

  // JB: REMOVE
  const materializeInput = (nextData) => {

    // JB: if the data is the same i.e. nothing is new dont do anything... it's to prevent recursion on componentDidUpdate and infinite loops
    if (data === nextData) {
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
      props.derivedAttributes, //  JB: derivedAttributes doesn't seem to serve any purpose. empty {}
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

    // JB: overwrite the old with the new. data; attrValues; materializedInput
    setData(newState.data)
    setAttrValues(newState.attrValues)
    setMaterializedInput(newState.materializedInput)
  }

  function parseDimensions() {
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
    // setDimensions({...foo})
  } // sort array??

  function parseData() {
    const foo = []

    PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {
      foo.push(record)
    })

    return foo
    // setNewMaterializedInput([...foo])
  }

  // Have to deal with this too; propUpdater was essentially a proxy function to this
  // props.valueFilter and props.val being recirculated
  // 0/4 usages shutdown
  function sendPropUpdate(command) {
    console.log('sendPropUpdate() :: ', props, ' => ', command)
    // console.log('sendPropUpdate() :: ', update(props, command)) // <= confirmation it is something off with this library. https://www.npmjs.com/package/immutability-helper

    props.onChange(update(props, command))
  }

  // 6/6 usages shutdown - SUNSETTED
  function propUpdater(key) {    
    return value => sendPropUpdate({[key]: {$set: value}})

    // JB - start
    // const test = (value) => sendPropUpdate({[key]: {$set: value}})
    // console.log('propUpdater() => ', test('rendererName')(event.target.value))
    // propUpdater('rendererName')(event.target.value)
    // return test
    // end
  }

  function setValuesInFilter(attribute, values) {
    sendPropUpdate({
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

  function addValuesToFilter(attribute, values) {
    console.log('up ', attribute, values)

    // JB: temp commented whilst troubleshoot
    if (attribute in props.valueFilter) {
      sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce((r, v) => {
            r[v] = {$set: true}
            return r
          }, {}),
        },
      })
    } else {
      setValuesInFilter(attribute, values)
    }
  }

  function removeValuesFromFilter(attribute, values) {
    // console.log('down ', props)
    // console.log('down ', attribute, { $unset: values })

    // JB - start
    // const command = { valueFilter: { [attribute]: { $unset: values } }  } //$unset to remove. $set to add.
    // console.log('COMMANDO 2 ', update(props, command))
    // end

    sendPropUpdate({
      valueFilter: { [attribute]: { $unset: values } }, // $unset = remove the list of keys in array from the target object. is this actually appropiate? for empty array.
    })
  }

  function createCluster(items, onSortableChangeHandler) {
    return (
      <ReactSortable
        className="dimension__list"
        tag="ul"
        list={items}
        setList={onSortableChangeHandler}
        // list={fooList1}
        // setList={setFooList1}
        group="pivot__dimension"
        ghostClass="sortable--ghost"
        chosenClass="sortable--chosen"
        dragClass="sortable--drag"
        filter=".criterion__filters-pane"
        preventOnFilter={false}
      >
        {/* {
          items.map(
            (item, index) => {
              return (
                <li className="ui__button sortable" key={`${item.id}-${index}`}>{item.name}</li>
              )
            }
          )
        } */}

        {items.map((item, index) => (
          <Dimension
            name={item.name}
            key={`${item.id}-${index}`}
            attrValues={attrValues[item.name]}
            valueFilter={props.valueFilter[item.name] || {}}
            sorter={getSort(props.sorters, item.name)}
            menuLimit={props.menuLimit}
            setValuesInFilter={setValuesInFilter.bind(this)}
            addValuesToFilter={addValuesToFilter.bind(this)}
            removeValuesFromFilter={removeValuesFromFilter.bind(this)}
          />
        ))}
      </ReactSortable>
    )
  }

  function createRendererSelector() {
    return (
      <header className="pivot__renderer">
        <select
          className="ui__select"
          value={activeRenderer}
          onChange={
            (event) => {
              setActiveRenderer(event.target.value)
              propUpdater('rendererName')(event.target.value) // JB: REMOVE
            }
          }
        >
          {
            Object.keys(props.renderers).map(
              (item, index) => (
                <option value={item} key={index}>{item}</option>
              )
            )
          }
        </select>

        {/* <label className="ui__toggle-switch">
          <input type="checkbox" checked={temp} onChange={(event) => setTemp(event.target.checked)} /> Table?
        </label>
        <pre style={{ fontSize: '8px' }}>temp = {JSON.stringify(temp)}</pre> */}

        <p className="ui__toggle">
          <label>
            <input type="radio" name="renderer" value="Table" checked={activeRenderer === "Table"} onChange={(event) => setActiveRenderer(event.target.value)} />
            <span>Table</span>
          </label>

          <label>
            <input type="radio" name="renderer" value="Chartjs Grouped Column Chart" checked={activeRenderer === "Chartjs Grouped Column Chart"} onChange={(event) => setActiveRenderer(event.target.value)} />
            <span>Chart</span>
          </label>
        </p>
        <pre style={{ fontSize: '8px' }}>Renderer = {JSON.stringify(activeRenderer)}</pre>
      </header>
    )
  }

  function createPlotSelector() {
    const numValsAllowed = props.aggregators[props.aggregatorName]([])().numInputs || 0

    const aggregatorCellOutlet = props.aggregators[props.aggregatorName]([])().outlet

    return (
      <aside className="pivot__aggregator">
        <select
          className="ui__select"
          value={activeAggregator}
          onChange={
            (event) => {
              setActiveAggregator(event.target.value)
              propUpdater('aggregatorName')(event.target.value) // JB: REMOVE
            }
          }
        >
          {
            Object.keys(props.aggregators).map(
              (item, index) => (
                <option value={item} key={`aggregator-${index}`}>{item}</option>
              )
            )
          }
        </select>

        {/* {numValsAllowed > 0 && <br />} */}

        {new Array(numValsAllowed).fill().map((n, index) => [
          <select
            className="ui__select"
            value={activeDimensions[index]}
            onChange={
              (event) => {
                setActiveDimensions(activeDimensions.toSpliced(index, 1, event.target.value))
                sendPropUpdate({ vals: { $splice: [[index, 1, event.target.value]] } })
              }
            }
            key={`dimension-${index}`}
          >
            {
              Object.keys(attrValues).map(
                (item, index) => (
                  !props.hiddenAttributes.includes(item) &&
                  !props.hiddenFromAggregators.includes(item) &&
                  <option value={item} key={index}>{item}</option>
                )
              )
            }
          </select>,
          // i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
        ])}

        {aggregatorCellOutlet && aggregatorCellOutlet(props.data)}
      </aside>
    )
  }

  function createSortBy() {
    return (
      <div className="pivot__sortBy">
        <h4>Sort {activeRenderer.toLowerCase().includes('table') ? 'by' : 'along'}</h4>
        <div className="sortBy__container">
          <div className="sortBy__y">
            <h4>{activeRenderer.toLowerCase().includes('table') ? 'row' : 'y-axis'}</h4>
            <div style={{ gap: '2px' }}>
              {
                sortBy.row.map((item, index) => (
                  <label key={index}>
                    <input
                      type="radio"
                      name="sort-by-row"
                      value={item.value}
                      checked={sortByRow === item.value}
                      onChange={
                        (event) => {
                          setSortByRow(event.target.value)
                          propUpdater('rowOrder')(sortByRow) // JB: REMOVE
                        }
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))
              }
            </div>
          </div>

          <hr />

          <div className="sortBy__x">
            <h4>{activeRenderer.toLowerCase().includes('table') ? 'column' : 'x-axis'}</h4>
            <div style={{ gap: '2px' }}>
              {
                sortBy.column.map((item, index) => (
                  <label key={index}>
                    <input
                      type="radio"
                      name="sort-by-column"
                      value={item.value}
                      checked={sortByColumn === item.value}
                      onChange={
                        (event) => {
                          setSortByColumn(event.target.value)
                          propUpdater('colOrder')(sortByColumn) // JB: REMOVE
                        }
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    )
  }

  function barCriterion() {
    return Object.keys(dimensions)
      .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
      .filter(
        ({ name }) =>
          !props.hiddenAttributes.includes(name) &&
          !props.hiddenFromDragDrop.includes(name)
      )
      .filter(
        ({ name }) =>
          !props.rows.includes(name) &&
          !props.cols.includes(name)
      )
  }

  function barRows() {
    return Object.keys(dimensions)
      .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
      .filter(
        ({ name }) =>
          !props.hiddenAttributes.includes(name) &&
          !props.hiddenFromDragDrop.includes(name)
      )
      .filter(
        ({ name }) =>
          props.rows.includes(name)
      )
  }

  function barCols() {
    return Object.keys(dimensions)
      .map((item, index) => ({ id: `dimension-${++index}`, name: item }))
      .filter(
        ({ name }) =>
          !props.hiddenAttributes.includes(name) &&
          !props.hiddenFromDragDrop.includes(name)
      )
      .filter(
        ({ name }) =>
          props.cols.includes(name)
      )
  }

  // const criterionCollection = Object.keys(attrValues)
  //   .filter(
  //     (item) => {
  //       return (
  //         !props.rows.includes(item) &&
  //         !props.cols.includes(item) &&
  //         !props.hiddenAttributes.includes(item) &&
  //         !props.hiddenFromDragDrop.includes(item)
  //       )
  //     }
  //   )
  //   .sort(sortAs(unusedOrder))

  const criterion = createCluster(
    fooCriterion,
    // barCriterion(),
    collection => setFooCriterion(collection),
    // criterionCollection,
    // order => setUnusedOrder(order),
  )

  const axisX = createCluster(
    fooCols,
    // barCols(),
    cols => {
      setFooCols(cols)
      propUpdater('cols') // JB: REMOVE
    },
  )

  const axisY = createCluster(
    fooRows,
    // barRows(),
    rows => {
      setFooRows(rows)
      propUpdater('rows') // JB: REMOVE
    },
  )
  
  return (
    <div className="pivot__ui">
      {createRendererSelector()}

      {createPlotSelector()}
      
      <div className="pivot__criterion">
        {criterion}
        {/* <pre style={{ fontSize: '8px' }}>FooCriterion {JSON.stringify(fooCriterion, null, 2)}</pre> */}
      </div>

      <div className="pivot__axis pivot__axis-x">
        {axisX}
        {/* <pre style={{ fontSize: '8px' }}>fooCols = {JSON.stringify(fooCols, null, 2)}</pre> */}
      </div>

      <div className="pivot__axis pivot__axis-y">
        {axisY}
        {/* <pre style={{ fontSize: '8px' }}>fooRows = {JSON.stringify(fooRows, null, 2)}</pre> */}
      </div>

      {createSortBy()}

      <article className="pivot__output">
        {/* <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.data, null, 2)}
        </pre> */}

        {/* <pre style={{ fontSize: '10px' }}>
          original :rendererName: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.rendererName,
            null, 2)
          }
          <br/>
          original :aggregatorName: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.aggregatorName,
              null, 2)
          }
          <br/>
          original :rowOrder: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.rowOrder,
              null, 2)
          }
          <br />
          original :colOrder: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.colOrder,
              null, 2)
          }
          <br />
          original :rows: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.rows,
              null, 2)
          }
          <br />
          original :cols: {
            JSON.stringify(
              {
                ...update(props, { data: { $set: materializedInput } })
              }.cols,
              null, 2)
          }
        </pre> */}

        {/* <pre style={{ fontSize: '10px' }}>
          props being passed from parent :: {
            JSON.stringify(
              Object.keys(props).filter((item) => item !== 'data'),
              null, 2)
          }
        </pre> */}

        {/* <pre style={{ fontSize: '10px' }}>
          state :activeRenderer => rendererName: {
            JSON.stringify(
              activeRenderer,
              null, 2)
          }
          <br/>
          state :activeAggregator => aggregatorName: {
            JSON.stringify(
              activeAggregator,
              null, 2)
          }
          <br />
          state :sortByRow => rowOrder: {
            JSON.stringify(
              sortByRow,
              null, 2)
          }
          <br />
          state :sortByColumn => colOrder: {
            JSON.stringify(
              sortByColumn,
              null, 2)
          }
        </pre> */}

        {/* <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.rows, null, 2)}
        </pre> */}

        {/* Confirmed what is being done. props are being recirculated for the purpose to then pump them into the <PivotTable /> business end. */}
        
        <figure className="ui__pane">
          <figcaption></figcaption>

          <PivotTable
            data={newMaterializedInput} // not really options // separated from props // materializedInput
            renderers={props.renderers} // not really options
            aggregators={props.aggregators} // not really options
            rendererName={activeRenderer} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            aggregatorName={activeAggregator} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            rowOrder={sortByRow} // unused // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            colOrder={sortByColumn} // unused // propUpdater:sendPropUpdate YES // REPLACED WITH STATE
            rows={fooRows.map(({name}) => name)} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE props.rows
            cols={fooCols.map(({ name }) => name)} // propUpdater:sendPropUpdate YES // REPLACED WITH STATE props.cols
            vals={props.vals} // sendPropUpdate YES // keep track of the dimension available against the aggregator in the dynamic dropdowns
            sorters={props.sorters}
            valueFilter={props.valueFilter} // sendPropUpdate YES // doesn't actually exist; used by filters component
            derivedAttributes={props.derivedAttributes} // unused
            menuLimit={props.menuLimit} // unused
            plotlyOptions={props.plotlyOptions}
            plotlyConfig={props.plotlyConfig} // empty
            tableOptions={props.tableOptions} // empty
            // tableColorScaleGenerator={props.tableColorScaleGenerator} // unused
          />
        </figure>

        {/* 
        Unused Props
        ===========
        onChange
        hiddenAttributes
        hiddenFromAggregators
        hiddenFromDragDrop
        menuLimit

        USED ONLY BY UI. Arguably there are more props that could be included rows? cols? vals? valueFilter?

        we still need to spread props however in combination with state ...{...props, data: data, renderName: activeRenderer}
        */}

        <figure className="ui__pane">
          {/* LEGACY IMPLEMENTATION: retained for reference */}
          {/* JB: whats going on here with this silly update() method?? should be passing state as props not spreading props!! */}
          <PivotTable
            {...update(props, {
              data: { $set: materializedInput },
            })}
          />
        </figure>

        {/* <pre style={{ fontSize: '10px' }}>{JSON.stringify(materializedInput, null, 2)}</pre> */}
      </article>

      <div className="pivot__filters">
        <h4 style={{ fontWeight: '400', marginTop: '0px' }}>Filter</h4>
        <ul>
          <li>Needs to select/target a dimension and then display the answered values available for filtering(turning on and off) here</li>
          <li>the UI is a challenge. I thinking multi-select paradigm but presented in a dropdown with checkboxes for each entry</li>
          <li>The above gets complicated because the key variables will potentially be multi-dimensional and the dropdown will need to incorporate a multi-select</li>
          <li>The mixed semantics is an obstacle. The dimensions/attributes are mixed prosed. There are questions, scalar attributes(age/gendar) and keys(identifiers).</li>
        </ul>
      </div>
    </div>
  )
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
