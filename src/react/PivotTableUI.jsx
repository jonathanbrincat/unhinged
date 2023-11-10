import React, { useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import { ReactSortable } from 'react-sortablejs'
import Dimension from './Dimension'
import PivotTable from './PivotTable'
import { PivotData, sortAs, getSort } from '../js/Utilities'
import { sortBy } from '../js/constants'

import './pivotTableUI.css'

/*
TODO

1) Address and finalise mapping/massaging of data to bridge incompatibilities between API and pivottable js
1) hardcoded mapping - id Vs name conundrum.
UPDATE: spoken to James and agreement that rather than than this hybrid half in, half out solution we assert the distinction. this is client and is v1 of the API. it will be succeeded by v2 of the API with the compute on the server in due course.

2) Not crucial but would be nice to have; set indeterminate state on filters select all checkbox / address UI hierarchy amongst component in implementation
2) what to do with the filters and controls and should they live inside pivottable ui component?
UPDATE: discussed with James; in addition the x-axis dimension needs filtering

3) review and overhaul the custom chartjs extension

4) Evaluate + completely upgrade/overhaul of ux and design
5) DONE
*/

const STATICS = {
  RENDERER: {
    table: 'Table',
    chart: 'Chartjs Grouped Column Chart',
  },
}

export default function PivotTableUI(props) {
  const [dimensions, setDimensions] = useState({})
  const [criterion, setCriterion] = useState([])
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
  const [isIndeterminate, setIsIndeterminate] = useState(false)

  useEffect(() => {
    setDimensions({...parseDimensions()})
  }, [props.data])

  useEffect(() => {
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
        .toSorted(sortAs([]))
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

  useEffect(() => {
    // console.log('A filter changed')

    // which filter changed?
    // if (!foo) return

    // setIsIndeterminate(
    //   !!filtersNamed.length &&
    //   (filtersNamed.length !== filters[foo].themes.length)
    // )

  }, [filters])

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
  }

  const numValsAllowed = props.aggregators[activeAggregator]([])().numInputs || 0

  const aggregatorCellOutlet = props.aggregators[activeAggregator]([])().outlet

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

    // JB: BUG. getting called on mount and reseting props.valueFilter
    // CAUSE = useEffect hook in Dimension.jsx
    setFilters({ ...filters, ...collection })
  }

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
        filter=".dimension__dropdown"
        preventOnFilter={false}
      >
        {
          items.map(
            (item, index) => {
              return (
                <Dimension
                  name={item.name}
                  key={`${item.id}-${index}`}

                  attrValues={dimensions[item.name]} // Object of the dimensions and their applicables values + tally of occurances; same as 'dimension' state
                  valueFilter={filters[item.name] || {}} // a record of enabled filters; if dimension value = true then the filter is applied(entry removed). if the object is empty, no filters are applied. strange its not just an Array/Set of valid keys
                  sorter={getSort(props.sorters, item.name)}
                  menuLimit={props.menuLimit}

                  setAllValuesInFilter={setAllValuesInFilter}
                  addValuesToFilter={addValuesToFilter}
                  removeValuesFromFilter={removeValuesFromFilter}
                  isIndeterminate={isIndeterminate}
                />
              )
            }
          )
        }
      </ReactSortable>
    )
  }
  
  return (
    <>
      {/* DEV ONLY */}
      {/* <div>
        <p>props.valueFilter</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(props.valueFilter, null, 2)}
        </pre>

        <p>Filters</p>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div> */}

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
                value={STATICS.RENDERER.table}
                checked={activeRenderer === STATICS.RENDERER.table}
                onChange={(event) => setActiveRenderer(event.target.value)}
              />
              <span>Table</span>
            </label>

            <label>
              <input
                type="radio"
                name="renderer"
                value={STATICS.RENDERER.chart}
                checked={activeRenderer === STATICS.RENDERER.chart}
                onChange={(event) => setActiveRenderer(event.target.value)}
              />
              <span>Chart</span>
            </label>
          </p>
        </header>

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

          {new Array(numValsAllowed).fill().map((n, index) => [
            <select
              className="ui__select"
              value={activeDimensions[index]}
              onChange={
                (event) => setActiveDimensions(activeDimensions.toSpliced(index, 1, event.target.value))
              }
              key={`dimension-${index}`}
            >
              {
                Object.keys(dimensions).map(
                  (item, index) => (
                    !props.hiddenAttributes.includes(item) &&
                    !props.hiddenFromAggregators.includes(item) &&
                    <option value={item} key={index}>{item}</option>
                  )
                )
              }
            </select>
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
            data={props.data}
            renderers={props.renderers}
            aggregators={props.aggregators}
            rows={axisY.map(({ name }) => name)}
            cols={axisX.map(({ name }) => name)}
            rendererName={activeRenderer}
            aggregatorName={activeAggregator}
            rowOrder={sortByRow}
            colOrder={sortByColumn}

            vals={props.vals} // JB: what is this? // used to specify aggregator/dimensions ['Tip', 'Total Bill']

            valueFilter={filters}

            plotlyOptions={props.plotlyOptions}
            plotlyConfig={props.plotlyConfig}
            tableOptions={props.tableOptions}
          />
        </article>
      </div>
    </>
  )
}

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
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
