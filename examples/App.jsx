import React from 'react'
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
    this.state = {pivotState: props}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({pivotState: nextProps})
  }

  render() {
    return (
      <div>
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
      </div>
    )
  }
}

export default class App extends React.Component {
  componentWillMount() {
    this.setState({
      pivotState: {
        data: tips,
        rows: ['Payer Gender'],
        cols: ['Party Size'],
        aggregatorName: 'Sum over Sum',
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
        plotlyOptions: {width: 900, height: 500},
        plotlyConfig: {},
        tableOptions: {
          clickCallback: function(e, value, filters, pivotData) {
            var names = []
            pivotData.forEachMatchingRecord(filters, function(
              record
            ) {
              names.push(record.Meal)
            })
            alert(names.join('\n'))
          },
        },
      },
    })
  }

  render() {
    return (
      <PivotTableUISmartWrapper {...this.state.pivotState} />
    )
  }
}
