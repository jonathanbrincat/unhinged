import React, { useState, useEffect }from 'react'
import PivotTableUI from '../src/PivotTableUI'
import TableRenderers from '../src/TableRenderers'
import createPlotlyComponent from 'react-plotly.js/factory'
// import { Chart } from 'react-chartjs-2'
import createPlotlyRenderers from '../src/PlotlyRenderers'
import createMyRenderers from '../src/MyRenderers'
import {sortAs} from '../src/Utilities'
import tips from './tips'
import '../src/pivottable.css'

const PlotlyComponent = createPlotlyComponent(window.Plotly) // JB: create instance of Plotly
// const ChartjsComponent = new Chart() // JB: create instance of chart.js

class PivotTableUISmartWrapper extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      pivotState: props
    }
  }

  // JB: why is this even necessary? he sets props to state on initilisation in the constructor then schedules props to override state whenever they are changed. 
  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('dirty south => ', nextProps)

    this.setState({pivotState: nextProps})
  }

  render() {
    return (
      <PivotTableUI
        renderers={Object.assign(
          {},
          TableRenderers,
          createPlotlyRenderers(PlotlyComponent),
          createMyRenderers(),
        )}
        {...this.state.pivotState}
        onChange={s => this.setState({pivotState: s})}
      />
    )
  }
}

export default function App() {
  // JB: this doesn't even need to be state. It's all static configuration.
  // const [ pivotState, setPivotState ] = useState({
  //   data: tips,
  //   rows: ['Payer Gender'],
  //   cols: ['Party Size'],
  //   // aggregatorName: 'Sum over Sum',
  //   vals: ['Tip', 'Total Bill'],
  //   rendererName: 'Grouped Column Chart',
  //   sorters: {
  //     Meal: sortAs(['Lunch', 'Dinner']),
  //     'Day of Week': sortAs([
  //       'Thursday',
  //       'Friday',
  //       'Saturday',
  //       'Sunday',
  //     ]),
  //   },
  //   plotlyOptions: { width: 900, height: 500 },
  //   plotlyConfig: {},
  //   tableOptions: {},
  // })

  const options = {
    data: tips,
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

  return (
    <PivotTableUISmartWrapper {...options} />
  )
}
