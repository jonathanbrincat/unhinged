import React, { useState }from 'react'
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

const PlotlyComponent = createPlotlyComponent(window.Plotly) // JB: create instance of Plotly
// const ChartjsComponent = new Chart() // JB: create instance of chart.js

const config = {
  rows: ['Payer Gender'],
  cols: ['Party Size'],
  // aggregatorName: 'Sum over Sum',
  vals: ['Tip', 'Total Bill'],
  rendererName: 'Grouped Column Chart',
  sorters: {
    Meal: sortAs(['Lunch', 'Dinner']),
    'Day of Week': sortAs([
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]),
  },
  plotlyOptions: { width: 900, height: 500 },
  plotlyConfig: {},
  tableOptions: {},
}

export default function App(props) {
  const [data, setData] = useState(tips)
  const [options, setOptions] = useState(config)

  return (
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
      onChange={state => setOptions(state)}
    />
  )
}
