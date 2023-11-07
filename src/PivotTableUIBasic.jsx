import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import { ReactSortable } from 'react-sortablejs'
import Dimension from './Dimension'
import { PivotData, sortAs, getSort } from './Utilities'
import PivotTable from './PivotTable'
import { sortBy } from './constants'

/*
TODO:
broken: aggregator by dimensions
broken: filtering; setValuesInFilter, addValuesToFilter, removeValuesFromFilter + look at menuLimit, sorter, valueFilter, attrValues DONE
broken: sortAs on criterion
*/

export default function PivotTableUI(props) {
  // const [data, setData] = useState([])
  const [attrValues, setAttrValues] = useState({}) // JB: appears to get generated. related to materializeInput(); now called simply 'data' // JB: I reckon all ooccurances of this can be subsituted for 'dimensions' state. they appear to be identical
  const [dimensions, setDimensions] = useState({})
  const [unusedOrder, setUnusedOrder] = useState([]) // JB: doesn't seem to serve a purpose
  const [criterion, setCriterion] = useState([]) // JB: attribute/dimension/criterion decide on naming and stick to the convention;
  const [axisX, setAxisX] = useState([])
  const [axisY, setAxisY] = useState([])

  const [activeRenderer, setActiveRenderer] = useState(
    props.rendererName in props.renderers
      ? props.rendererName
      : Object.keys(props.renderers)[0]
  )
  const [activeAggregator, setActiveAggregator] = useState(props.aggregatorName ?? 'Count') // JB: needs default??
  const [activeDimensions, setActiveDimensions] = useState([...props.vals])
  const [sortByRow, setSortByRow] = useState(sortBy.row[0].value)
  const [sortByColumn, setSortByColumn] = useState(sortBy.column[0].value)

  const [filters, setFilters] = useState(props.valueFilter ?? {})

  useEffect(() => {
    console.log('-- incoming data changed --')

    // setData([...parseData()])
    setDimensions({...parseDimensions()})
    setAttrValues({...parseValues()})

  }, [props.data])

  useEffect(() => {
    console.log('-- dimensions changed --', dimensions)

    setCriterion(
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
        // .sort(sortAs(unusedOrder))
    )

    setAxisX(
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

    setAxisY(
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

  }, [dimensions])

  function parseData() {
    const results = []

    PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {
      results.push(record)
    })

    return results
  }

  function parseDimensions() {
    const results = {}
    let recordsProcessedTally = 0 // this is how the values are generated. by counting occurances

    PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {

      // examine every key of every record
      for (const attr of Object.keys(record)) {

        // if key doesn't exist yet
        if (!(attr in results)) {
          // add the key to our dictionary // use Map()??
          results[attr] = {}

          if (recordsProcessedTally > 0) {
            results[attr].null = recordsProcessedTally
          }

          // console.log(attr)
        }
      }

      // for every key that exists on results
      for (const attr in results) {
        const value = attr in record ? record[attr] : 'null'

        // if there isn't a value already assigned. zero the figure.
        if (!(value in results[attr])) {
          results[attr][value] = 0
        }

        // increment the occurance count/tally
        results[attr][value]++
      }

      recordsProcessedTally++
    })

    return results
  } // sort array??

  // JB: appears to achieve exactly the same as parseDimensions(). created objects are identical.
  function parseValues() {
    const _attrValues = {}
    let recordsProcessedTally = 0

    PivotData.forEachRecord(props.data, props.derivedAttributes, (record) => {
      for (const attr of Object.keys(record)) {
        if (!(attr in _attrValues)) {
          _attrValues[attr] = {}

          if (recordsProcessedTally > 0) {
            _attrValues[attr].null = recordsProcessedTally
          }
        }
      }

      for (const attr in _attrValues) {
        const value = attr in record ? record[attr] : 'null'

        if (!(value in _attrValues[attr])) {
          _attrValues[attr][value] = 0
        }

        _attrValues[attr][value]++
      }

      recordsProcessedTally++
    })

    console.log('OUTPUT = ', _attrValues)
    return _attrValues
  }

  function setAllValuesInFilter(attribute, values) {
    // console.log('setAllValuesInFilter ', attribute, values)

    const { [attribute]: discard, ...rest } = filters
    const collection = values.reduce((acc, obj) => {
      if (acc[attribute]) {
        acc[attribute][obj] = true
      } else {
        acc[attribute] = { [obj]: true }
      }

      return acc
    }, rest)

    setFilters({ ...filters, ...collection })
  }

  function addValuesToFilter(attribute, values) {
    // console.log('addValuesToFilter ', attribute, values)

    const collection = values.reduce((acc, obj) => {
      // Method 1
      if(acc[attribute]) {
        acc[attribute][obj] = true
      } else {
        acc[attribute] = {[obj]: true}
      }

      return acc

      // Method 2
      // const curGroup = acc[attribute] ?? {}
      // return { ...acc, [attribute]: { ...curGroup, ...{[obj]: true} } }
    }, filters)

    setFilters({ ...filters, ...collection })
  }

  function removeValuesFromFilter(attribute, values) {
    // console.log('removeValuesFromFilter ', attribute, values)

    const collection = values.reduce((acc, obj) => {
      if (acc[attribute]) {
        // Method 1
        delete acc[attribute][obj]
        
        // Method 2
        // const {[obj]: discard, ...rest} = acc[attribute]
        // acc[attribute] = rest
      }

      return acc
    }, filters)

    setFilters({ ...filters, ...collection })
  }

  const numValsAllowed = props.aggregators[props.aggregatorName]([])().numInputs || 0

  const aggregatorCellOutlet = props.aggregators[props.aggregatorName]([])().outlet

  function createCluster(items, onSortableChangeHandler) {
    return (
      <ReactSortable
        className="dimension__list"
        tag="ul"
        list={items}
        setList={onSortableChangeHandler}
        group="pivot__dimension"
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
                // <li className="ui__button sortable" key={`${item.id}-${index}`}>{item.name}</li>
                <Dimension
                  name={item.name}
                  key={`${item.id}-${index}`}

                  // JB: what does this lot do?
                  attrValues={attrValues[item.name]} // Object of the dimensions and their applicables values + tally of occurances; same as 'dimension' state
                  valueFilter={filters[item.name] || {}} // a record of enabled filters; if dimension value = true then the filter is applied(entry removed). if the object is empty, no filters are applied. strange its not just an Array/Set of valid keys
                  sorter={getSort(props.sorters, item.name)}
                  menuLimit={props.menuLimit}

                  setAllValuesInFilter={setAllValuesInFilter}
                  addValuesToFilter={addValuesToFilter}
                  removeValuesFromFilter={removeValuesFromFilter}
                />
              )
            }
          )
        }
      </ReactSortable>
    )
  }
  
  console.log('-- Render -- ')
  return (
    <>
      {/* DEV ONLY */}
      <div>
        {/* <p>Props data</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.data, null, 2)}
        </pre>

        <p>Data</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>

        <p>Dimensions</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(dimensions, null, 2)}
        </pre>
        
        <p>Criterion</p>
        <pre style={{ fontSize: '10px' }}>
          {
            JSON.stringify(
              Object.keys(dimensions)
              .map((item, index) => ({ id: `dimension-${++index}`, name: item })),
              null, 2)
          }
        </pre>

        <p>props.valueFilter</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.valueFilter, null, 2)}
        </pre>
        
        <p>props.sorters</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.sorters, null, 2)}
        </pre> */}

        <p>Filters</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>

      <div className="pivot__ui">
        <header className="pivot__renderer">
          <select
            className="ui__select"
            value={activeRenderer}
            onChange={
              (event) => setActiveRenderer(event.target.value)
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

          <p className="ui__toggle">
            <label>
              <input
                type="radio"
                name="renderer"
                value="Table"
                checked={activeRenderer === "Table"}
                onChange={(event) => setActiveRenderer(event.target.value)}
              />
              <span>Table</span>
            </label>

            <label>
              <input
                type="radio"
                name="renderer"
                value="Chartjs Grouped Column Chart"
                checked={activeRenderer === "Chartjs Grouped Column Chart"}
                onChange={(event) => setActiveRenderer(event.target.value)}
              />
              <span>Chart</span>
            </label>
          </p>
        </header>

        {/* DEV ONLY */}
        <pre style={{ fontSize: '10px' }}>Renderer = {JSON.stringify(activeRenderer)}</pre>

        <aside className="pivot__aggregator">
          <select
            className="ui__select"
            value={activeAggregator}
            onChange={
              (event) => setActiveAggregator(event.target.value)
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
                (event) => setActiveDimensions(activeDimensions.toSpliced(index, 1, event.target.value))
              }
              key={`dimension-${index}`}
            >
              {/* {
                Object.keys(attrValues).map(
                  (item, index) => (
                    !props.hiddenAttributes.includes(item) &&
                    !props.hiddenFromAggregators.includes(item) &&
                    <option value={item} key={index}>{item}</option>
                  )
                )
              } */}
            </select>,
            // i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
          ])}

          {aggregatorCellOutlet && aggregatorCellOutlet(props.data)}
        </aside>

        <div className="pivot__criterion">
          {
            createCluster(
              criterion,
              (collection) => setCriterion(collection),
            )
          }
        </div>

        <div className="pivot__axis pivot__axis-x">
          {
            createCluster(
              axisX,
              (collection) => setAxisX(collection),
            )
          }
        </div>

        <div className="pivot__axis pivot__axis-y">
          {
            createCluster(
              axisY,
              (collection) => setAxisY(collection),
            )
          }
        </div>

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
                          (event) => setSortByRow(event.target.value)
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
                          (event) => setSortByColumn(event.target.value)
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

        <article className="pivot__output">
          <PivotTable
            data={props.data} // JB: will happily work either way with props.data or data; don't really understand why author felt it necessary to pass 'newMaterializedInput'. The clue might be in the name. Think was struggling with the concept of reactivity.
            // data={data}
            renderers={props.renderers}
            aggregators={props.aggregators}
            rows={axisY.map(({ name }) => name)}
            cols={axisX.map(({ name }) => name)}
            rendererName={activeRenderer}
            aggregatorName={activeAggregator}
            rowOrder={sortByRow}
            colOrder={sortByColumn} 

            vals={props.vals} // JB: what is this?

            // sorters={props.sorters} // used by Filters UI, unsure why it would need to also be passed down
            valueFilter={filters}

            // plotlyOptions={{}}
            // plotlyConfig={{}}
            // tableOptions={{}}
          />
        </article>
      </div>
    </>
  )
}

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
  hiddenAttributes: PropTypes.arrayOf(PropTypes.string),
  // hiddenFromAggregators: PropTypes.arrayOf(PropTypes.string),
  hiddenFromDragDrop: PropTypes.arrayOf(PropTypes.string),
  menuLimit: PropTypes.number,
})

PivotTableUI.defaultProps = Object.assign({}, PivotTable.defaultProps, {
  hiddenAttributes: [],
//   hiddenFromAggregators: [],
  hiddenFromDragDrop: [],
  menuLimit: 500,
  rows: [],
  cols: [],
})
