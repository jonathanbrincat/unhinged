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

const options = {
  // rendererName: 'Grouped Column Chart',
  // aggregatorName: 'Sum over Sum',
  rows: ['Payer Gender'],
  cols: ['Party Size'],
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
}

export default function App(props) {
  const [data, setData] = useState(tips)
  const [pivotState, setPivotState] = useState({})

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

      // JB: REMOVE
      onChange={(state) => {
        setPivotState(state)
      }}
      {...pivotState}
    />
  )
}
