import React, { useState, useEffect }from 'react'
import Papa from 'papaparse'
import PivotTableUI from '../src/PivotTableUI'
import TableRenderers from '../src/TableRenderers'
import { aggregators } from '../src/Utilities'
import createPlotlyComponent from 'react-plotly.js/factory'
// import { Chart } from 'react-chartjs-2'
import createPlotlyRenderers from '../src/PlotlyRenderers'
import createMyRenderers from '../src/MyRenderers'
import {sortAs} from '../src/Utilities'
import tips from './tips'
import '../src/pivottable.css'
import '../src/styles.css'

const API = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQfobphpVMblTtx5LpBV9EZYqP7LAXrhSNiW7tf--x4MzESavX5O7Ad8IQ95RyjBkSAX46HBw-esJzd/pub?output=csv'

const PlotlyComponent = createPlotlyComponent(window.Plotly) // JB: create instance of Plotly
// const ChartjsComponent = new Chart() // JB: create instance of chart.js

const options = {
  // rendererName: 'Grouped Column Chart',
  // aggregatorName: 'Sum over Sum',
  // rows: ['Payer Gender'],
  // cols: ['Party Size'],
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
  const [data, setData] = useState(tips)
  const [pivotState, setPivotState] = useState({})

  useEffect(() => {
    fetch(API)
      .then((response) => response.text())
      .then((csv) => {
        Papa.parse(csv, {
          complete: (parsed) => setData(parsed.data),
          error: (error) => console.log(error),
        })
      })
      .catch((error) => {
        console.log('Something went wrong retrieving the csv data from Google Docs :: ', error)
      })
  }, [])

  return (
    <>
      <p>CSV Dataset</p>
      <pre style={{ fontSize: '10px' }}>{JSON.stringify(data)}</pre>

      <div style={{ display: 'flex', gap: '24px' }}>
        <p style={{ margin: '1em 0', display: 'flex', flexDirection: 'column', flexBasis: '50%', gap: '6px' }}>
          <label htmlFor="field-data-to-explore">Select a question to analyse</label>
          <select id="field-data-to-explore" className="ui__select">
            <option value="q1">Where do you buy ice-cream?</option>
            <option value="q2">Are you considering buying an electric car next year?</option>
          </select>
        </p>

        <p style={{ margin: '1em 0', display: 'flex', flexDirection: 'column', flexBasis: '50%', gap: '6px' }}>
          <label htmlFor="field-key-variable-to-apply">Select a key variable</label>
          <select id="field-key-variable-to-apply" className="ui__select">
            <option value="q1">Would you buy a Tesla?</option>
            <option value="q2">What are the key features you look for in a dog product (treats/toys) used in a bonding moment</option>
          </select>
        </p>
      </div>

      {/* there really needs to be a way to declare a primary_key field in the imported csv data; for 2 reasons. 1) to allow custom aggregators to known what field is the unique identifier 2) so that the primary_key can be excluded from the available dimensions., */}
      <PivotTableUI
        data={data}
        renderers={{
          ...TableRenderers,
          ...createPlotlyRenderers(PlotlyComponent),
          ...createMyRenderers(),
        }}
        aggregators={{
          ...aggregators,
        }}
        {...options}
        
        // JB: REMOVE
        onChange={(state) => {
          setPivotState(state)
        }}
        {...pivotState}
      />
    </>
  )
}
