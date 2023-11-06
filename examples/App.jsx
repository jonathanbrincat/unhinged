import React, { useState, useEffect }from 'react'
import Papa from 'papaparse'
// import PivotTableUI from '../src/PivotTableUI' // JB: the reactivity is broken in the original version because it was never implemented correctly
import PivotTableUI from '../src/PivotTableUIBasic'
import TableRenderers from '../src/TableRenderers'
import { aggregators } from '../src/Utilities'
import createPlotlyComponent from 'react-plotly.js/factory'
// import { Chart } from 'react-chartjs-2'
import createPlotlyRenderers from '../src/PlotlyRenderers'
import createChartjsRenderers from '../src/ChartjsRenderers'
import {sortAs} from '../src/Utilities'
import MOCK, { ARRAY_OF_OBJECTS, ARRAY_OF_ARRAYS } from './tips'
import '../src/pivottable.css'
import '../src/styles.css'

const API = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfobphpVMblTtx5LpBV9EZYqP7LAXrhSNiW7tf--x4MzESavX5O7Ad8IQ95RyjBkSAX46HBw-esJzd/pub?output=csv'

const PlotlyComponent = createPlotlyComponent(window.Plotly) // JB: create instance of Plotly
// const ChartjsComponent = new Chart() // JB: create instance of chart.js

const options = {
  // rendererName: 'Grouped Column Chart',
  // aggregatorName: 'Sum over Sum',
  cols: ['Party Size'],  // semi-required; if nothing assigned there is nothing to display //axisX
  rows: ['Payer Gender'], // semi-required; if nothing assigned there is nothing to display // axisY
  // vals: ['Tip', 'Total Bill'],
  // sorters: {
  //   Meal: sortAs(['Lunch', 'Dinner']),
  //   'Day of Week': sortAs([
  //     'Thursday',
  //     'Friday',
  //     'Saturday',
  //     'Sunday',
  //   ]),
  // },
  plotlyOptions: { width: 900, height: 500 },
  plotlyConfig: {},
  tableOptions: {},
  unusedOrientationCutoff: Infinity,
}

export default function App(props) {
  const [data, setData] = useState(MOCK)
  const [pivotState, setPivotState] = useState({})

  console.log('hello ', {
    ...TableRenderers,
    ...createPlotlyRenderers(PlotlyComponent),
    ...createChartjsRenderers(),
  })

  // useEffect(() => {
  //   fetch(API)
  //     .then((response) => response.text())
  //     .then((csv) => {
  //       Papa.parse(csv, {
  //         complete: (parsed) => setData(parsed.data),
  //         error: (error) => console.log(error),
  //       })
  //     })
  //     .catch((error) => {
  //       console.log('Something went wrong retrieving the csv data from Google Docs :: ', error)
  //     })
  // }, [])

  return (
    <>
      <p>Dataset</p>
      <pre style={{ fontSize: '10px' }}>{JSON.stringify(data)}</pre>

      {/* there really needs to be a way to declare a primary_key field in the imported csv data; for 2 reasons. 1) to allow custom aggregators to known what field is the unique identifier 2) so that the primary_key can be excluded from the available dimensions., */}
      <PivotTableUI
        data={data} // REQUIRED - everything else is optional
        renderers={{
          ...TableRenderers,
          ...createPlotlyRenderers(PlotlyComponent),
          ...createChartjsRenderers(),
        }}
        aggregators={{
          ...aggregators,
        }}
        {...options}
        
        // JB: REMOVE
        // onChange={(state) => {
        //   setPivotState(state)
        // }}
        // {...pivotState}
      />
    </>
  )
}
